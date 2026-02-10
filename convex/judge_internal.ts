import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const getGroupTasks = internalQuery({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const getTaskFinalStep = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("steps")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
    const sorted = steps.sort((a, b) => a.stepNumber - b.stepNumber);
    return sorted[sorted.length - 1] ?? null;
  },
});

export const getTaskStepByNumber = internalQuery({
  args: { taskId: v.id("tasks"), stepNumber: v.number() },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("steps")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
    return steps.find((s) => s.stepNumber === args.stepNumber) ?? null;
  },
});

export const saveQualityScore = internalMutation({
  args: {
    taskId: v.id("tasks"),
    qualityScore: v.number(),
    qualityBreakdown: v.string(),
    qualityStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      qualityScore: args.qualityScore,
      qualityBreakdown: args.qualityBreakdown,
      qualityStatus: args.qualityStatus,
    });
  },
});

export const setQualityStatus = internalMutation({
  args: {
    taskId: v.id("tasks"),
    qualityStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      qualityStatus: args.qualityStatus,
    });
  },
});
