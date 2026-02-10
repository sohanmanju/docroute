"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Feature-specific context for the judge rubric
const FEATURE_CONTEXT: Record<string, string> = {
  invoice:
    "The task was to process an invoice: extract line items, categorize expenses, and flag anomalies.",
  contract:
    "The task was to analyze a contract: extract key terms, summarize in plain English, and flag risky clauses.",
  meeting:
    "The task was to process meeting notes: structure them, extract action items, and draft a follow-up email.",
  image:
    "The task was to analyze an image: describe it, generate SEO alt-text, and produce a brand fit analysis.",
};

/** Fisher-Yates shuffle - returns shuffled copy + mapping */
function shuffleWithMapping<T>(items: T[]): { shuffled: T[]; mapping: number[] } {
  const indices = items.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    shuffled: indices.map((i) => items[i]),
    mapping: indices,
  };
}

const LABELS = ["A", "B", "C"] as const;

export const evaluateGroup = internalAction({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    // Fetch all tasks in the group
    const tasks = await ctx.runQuery(internal.judge_internal.getGroupTasks, {
      groupId: args.groupId,
    });

    if (tasks.length !== 3) {
      console.error(`Judge: expected 3 tasks, got ${tasks.length}`);
      return;
    }

    // Get final step result for each task
    const taskResults: Array<{
      taskId: (typeof tasks)[0]["_id"];
      mode: string;
      result: string;
    }> = [];

    for (const task of tasks) {
      const finalStep = await ctx.runQuery(
        internal.judge_internal.getTaskFinalStep,
        { taskId: task._id }
      );
      taskResults.push({
        taskId: task._id,
        mode: task.mode,
        result: finalStep?.result ?? "(no output)",
      });
    }

    // Fisher-Yates shuffle for blind labeling
    const { shuffled, mapping } = shuffleWithMapping(taskResults);
    console.log(
      `Judge: blind mapping - ${mapping.map((origIdx, pos) => `Response ${LABELS[pos]}=${taskResults[origIdx].mode}`).join(", ")}`
    );

    const feature = tasks[0].feature;
    const context = FEATURE_CONTEXT[feature] ?? "The task was a document processing pipeline.";

    // Build ground truth for the judge
    const inputText = tasks[0].inputText ?? "";
    const hasImage = !!tasks[0].fileStorageId;
    let groundTruth = "";

    if (inputText) {
      // Text-based features: use the original input as ground truth
      groundTruth = `\nSOURCE DOCUMENT (ground truth - use this to verify factual accuracy):\n${inputText.slice(0, 3000)}`;
    } else if (hasImage) {
      // Image-based features: use step 0 consensus as ground truth
      const extractions: string[] = [];
      for (const task of tasks) {
        const step0 = await ctx.runQuery(
          internal.judge_internal.getTaskStepByNumber,
          { taskId: task._id, stepNumber: 0 }
        );
        if (step0?.result) {
          extractions.push(step0.result.slice(0, 1500));
        }
      }
      if (extractions.length > 0) {
        groundTruth = `\nCONSENSUS GROUND TRUTH - The original input was an image. Below are ${extractions.length} independent extractions from the first pipeline step. Use points where multiple extractions agree as the factual baseline for scoring accuracy:\n${extractions.map((e, i) => `--- Extraction ${i + 1} ---\n${e}`).join("\n\n")}`;
      }
    }

    // Build rubric prompt
    const prompt = `You are a blind quality evaluator for AI-generated outputs. You will score three outputs independently on a 1-5 scale.

CONTEXT: ${context}
${groundTruth}

IMPORTANT RULES:
- Score each output INDEPENDENTLY. Do NOT compare them to each other.
- Do NOT reward verbosity. Concise, accurate outputs are just as good as long ones.
- Base scores strictly on quality criteria below.

SCORING RUBRIC (each 1.0-5.0, can use decimals):
- accuracy: Factual correctness, no hallucinations, faithful to input
- completeness: Coverage of all required elements from the task
- formatting: Structure, readability, proper organization

${shuffled.map((item, i) => `--- Response ${LABELS[i]} ---\n${item.result.slice(0, 3000)}`).join("\n\n")}

Respond with ONLY valid JSON, no markdown fencing:
{
  ${hasImage && !inputText ? `"consensus": "<2-3 sentence summary of the key facts that multiple extractions agreed on - this is the ground truth you used>",\n  ` : ""}"A": { "accuracy": <number>, "completeness": <number>, "formatting": <number>, "rationale": "<brief justification>" },
  "B": { "accuracy": <number>, "completeness": <number>, "formatting": <number>, "rationale": "<brief justification>" },
  "C": { "accuracy": <number>, "completeness": <number>, "formatting": <number>, "rationale": "<brief justification>" }
}`;

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://docroute.app",
            "X-Title": "DocRoute Judge",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            max_tokens: 1024,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      let content: string = data.choices?.[0]?.message?.content ?? "";

      // Strip markdown fencing if present
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      const parsed = JSON.parse(content) as Record<string, unknown>;
      const consensus = (parsed.consensus as string) ?? "";

      const scores = parsed as Record<
        string,
        { accuracy: number; completeness: number; formatting: number; rationale: string }
      >;

      // Map scores back to original tasks via shuffle mapping
      for (let pos = 0; pos < LABELS.length; pos++) {
        const label = LABELS[pos];
        const score = scores[label];
        if (!score || typeof score.accuracy !== "number") continue;

        const origIdx = mapping[pos];
        const task = taskResults[origIdx];
        const overall =
          Math.round(
            ((score.accuracy + score.completeness + score.formatting) / 3) * 100
          ) / 100;

        await ctx.runMutation(internal.judge_internal.saveQualityScore, {
          taskId: task.taskId,
          qualityScore: overall,
          qualityBreakdown: JSON.stringify({
            accuracy: score.accuracy,
            completeness: score.completeness,
            formatting: score.formatting,
            overall,
            rationale: score.rationale,
            ...(consensus ? { consensus } : {}),
          }),
          qualityStatus: "completed",
        });
      }

      console.log(`Judge: evaluation complete for group ${args.groupId}`);
    } catch (error) {
      console.error("Judge evaluation failed:", error);
      // Mark all tasks as failed
      for (const task of tasks) {
        await ctx.runMutation(internal.judge_internal.setQualityStatus, {
          taskId: task._id,
          qualityStatus: "failed",
        });
      }
    }
  },
});
