import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const MODES = ["smart", "frontier", "budget"] as const;

// Pipeline definitions — must match lib/pipelines.ts
// We duplicate the step metadata here because Convex functions can't import from lib/
const PIPELINE_STEPS: Record<
  string,
  Array<{ name: string; taskType: string }>
> = {
  invoice: [
    { name: "Extract Line Items", taskType: "vision" },
    { name: "Categorize Expenses", taskType: "classification" },
    { name: "Flag Anomalies", taskType: "reasoning" },
  ],
  contract: [
    { name: "Extract Key Terms", taskType: "extraction" },
    { name: "Plain-English Summary", taskType: "summarization" },
    { name: "Flag Risky Clauses", taskType: "reasoning" },
  ],
  meeting: [
    { name: "Structure Notes", taskType: "extraction" },
    { name: "Extract Action Items", taskType: "extraction" },
    { name: "Draft Follow-up Email", taskType: "creative" },
  ],
  image: [
    { name: "Describe Image", taskType: "vision" },
    { name: "Generate SEO Alt-Text", taskType: "classification" },
    { name: "Brand Fit Analysis", taskType: "reasoning" },
  ],
};

function getModelForTask(taskType: string, mode: string): string {
  if (mode === "frontier") return "anthropic/claude-sonnet-4";
  if (mode === "budget") {
    // DeepSeek doesn't support vision — fall back to Gemini Flash for image tasks
    if (taskType === "vision") return "google/gemini-2.0-flash-001";
    return "deepseek/deepseek-chat";
  }
  return "openrouter/auto";
}

// --- Public Mutations ---

export const createComparison = mutation({
  args: {
    feature: v.string(),
    fileStorageId: v.optional(v.id("_storage")),
    inputText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const groupId = crypto.randomUUID();
    const now = Date.now();
    const pipelineSteps = PIPELINE_STEPS[args.feature];
    if (!pipelineSteps) throw new Error(`Unknown feature: ${args.feature}`);

    for (const mode of MODES) {
      const taskId = await ctx.db.insert("tasks", {
        feature: args.feature,
        mode,
        groupId,
        status: "pending",
        totalCost: 0,
        totalLatency: 0,
        createdAt: now,
        fileStorageId: args.fileStorageId,
        inputText: args.inputText,
      });

      for (let i = 0; i < pipelineSteps.length; i++) {
        const step = pipelineSteps[i];
        await ctx.db.insert("steps", {
          taskId,
          stepNumber: i,
          name: step.name,
          taskType: step.taskType,
          status: "pending",
          requestedModel: getModelForTask(step.taskType, mode),
          createdAt: now,
        });
      }

      await ctx.scheduler.runAfter(0, internal.pipeline.runPipeline, {
        taskId,
      });
    }

    return groupId;
  },
});

// --- Internal Mutations ---

export const updateStep = internalMutation({
  args: {
    stepId: v.id("steps"),
    status: v.string(),
    actualModel: v.optional(v.string()),
    latency: v.optional(v.number()),
    cost: v.optional(v.number()),
    result: v.optional(v.string()),
    prompt: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { stepId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(stepId, filtered);
  },
});

export const completeTask = internalMutation({
  args: {
    taskId: v.id("tasks"),
    totalCost: v.number(),
    totalLatency: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    await ctx.db.patch(args.taskId, {
      status: "completed",
      totalCost: args.totalCost,
      totalLatency: args.totalLatency,
    });

    // Check if all tasks in the group are now completed
    const groupTasks = await ctx.db
      .query("tasks")
      .withIndex("by_groupId", (q) => q.eq("groupId", task.groupId))
      .collect();

    const allCompleted = groupTasks.every(
      (t) => t._id === args.taskId ? true : t.status === "completed"
    );
    const noneEvaluating = groupTasks.every((t) => !t.qualityStatus);

    if (allCompleted && noneEvaluating && groupTasks.length === 3) {
      // Mark all as evaluating and schedule the judge
      for (const t of groupTasks) {
        await ctx.db.patch(t._id, { qualityStatus: "evaluating" });
      }
      await ctx.scheduler.runAfter(0, internal.judge.evaluateGroup, {
        groupId: task.groupId,
      });
    }
  },
});

export const failTask = internalMutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: "failed" });
  },
});

export const markTaskRunning = internalMutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: "running" });
  },
});

// --- Queries ---

export const getComparison = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const getSteps = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("steps")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
    return steps.sort((a, b) => a.stepNumber - b.stepNumber);
  },
});

export const getStepsByGroup = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const allSteps = [];
    for (const task of tasks) {
      const steps = await ctx.db
        .query("steps")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .collect();
      allSteps.push(
        ...steps.map((s) => ({ ...s, mode: task.mode, feature: task.feature }))
      );
    }
    return allSteps.sort((a, b) => a.stepNumber - b.stepNumber);
  },
});

export const listRecentComparisons = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    // Group by groupId, return unique groups
    const seen = new Set<string>();
    const groups: Array<{
      groupId: string;
      feature: string;
      createdAt: number;
      tasks: typeof tasks;
    }> = [];

    for (const task of tasks) {
      if (seen.has(task.groupId)) {
        const group = groups.find((g) => g.groupId === task.groupId);
        if (group) group.tasks.push(task);
        continue;
      }
      seen.add(task.groupId);
      if (groups.length >= limit) break;
      groups.push({
        groupId: task.groupId,
        feature: task.feature,
        createdAt: task.createdAt,
        tasks: [task],
      });
    }

    return groups;
  },
});

export const getDashboardStats = query({
  handler: async (ctx) => {
    const allTasks = await ctx.db.query("tasks").collect();

    const completedTasks = allTasks.filter((t) => t.status === "completed");
    const groupIds = new Set(completedTasks.map((t) => t.groupId));

    let smartTotal = 0;
    let frontierTotal = 0;
    let budgetTotal = 0;
    const modelUsage: Record<string, number> = {};

    for (const task of completedTasks) {
      if (task.mode === "smart") smartTotal += task.totalCost;
      if (task.mode === "frontier") frontierTotal += task.totalCost;
      if (task.mode === "budget") budgetTotal += task.totalCost;

      const steps = await ctx.db
        .query("steps")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .collect();

      for (const step of steps) {
        if (step.actualModel && task.mode === "smart") {
          modelUsage[step.actualModel] =
            (modelUsage[step.actualModel] ?? 0) + 1;
        }
      }
    }

    const savings =
      frontierTotal > 0 ? (1 - smartTotal / frontierTotal) * 100 : 0;

    // Calculate average quality for smart-mode tasks
    const smartScored = completedTasks.filter(
      (t) => t.mode === "smart" && t.qualityScore != null
    );
    const avgQuality =
      smartScored.length > 0
        ? Math.round(
            (smartScored.reduce((sum, t) => sum + (t.qualityScore ?? 0), 0) /
              smartScored.length) *
              100
          ) / 100
        : null;

    return {
      totalComparisons: groupIds.size,
      totalCost: smartTotal,
      frontierCost: frontierTotal,
      budgetCost: budgetTotal,
      savings: Math.round(savings),
      modelUsage,
      avgQuality,
    };
  },
});
