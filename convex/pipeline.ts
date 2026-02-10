"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Pipeline definitions — duplicated here since Convex Node actions can't import from lib/
const PIPELINE_PROMPTS: Record<
  string,
  Array<{ name: string; taskType: string; promptTemplate: string }>
> = {
  invoice: [
    {
      name: "Extract Line Items",
      taskType: "vision",
      promptTemplate: `You are an invoice processing assistant. Extract all line items from this invoice.

For each line item, provide:
- Description
- Quantity
- Unit price
- Total

Also extract: vendor name, invoice number, date, subtotal, tax, and total.

Format the output as structured JSON.

{{input}}`,
    },
    {
      name: "Categorize Expenses",
      taskType: "classification",
      promptTemplate: `You are an expense categorization assistant. Given these extracted invoice line items, categorize each expense.

Categories: Office Supplies, Software/SaaS, Travel, Meals & Entertainment, Professional Services, Hardware, Marketing, Utilities, Other.

For each line item, assign the most appropriate category and a confidence score (high/medium/low).

Format as JSON with the original items plus category and confidence fields.

Previous step output:
{{previousResult}}`,
    },
    {
      name: "Flag Anomalies",
      taskType: "reasoning",
      promptTemplate: `You are a financial anomaly detection assistant. Analyze these categorized invoice expenses for potential issues.

Look for:
1. Unusually high amounts for the category
2. Duplicate or near-duplicate charges
3. Suspicious vendor patterns
4. Tax calculation errors
5. Missing or inconsistent data

For each anomaly found, provide:
- Severity (high/medium/low)
- Description of the issue
- Affected line item(s)
- Recommended action

Be thorough - catching anomalies is critical for financial oversight.

Categorized expenses:
{{previousResult}}`,
    },
  ],
  contract: [
    {
      name: "Extract Key Terms",
      taskType: "extraction",
      promptTemplate: `You are a contract analysis assistant. Extract all key terms and clauses from this contract.

Extract:
- Parties involved
- Effective date and term/duration
- Payment terms and amounts
- Termination clauses
- Liability limitations
- Confidentiality provisions
- Intellectual property rights
- Governing law/jurisdiction
- Key obligations for each party
- Any penalties or fees

Format as structured JSON.

Contract text:
{{input}}`,
    },
    {
      name: "Plain-English Summary",
      taskType: "summarization",
      promptTemplate: `You are a legal summarization assistant. Create a clear, plain-English summary of this contract based on the extracted terms.

Write for a non-lawyer audience. Explain:
- What this contract is about (1-2 sentences)
- What each party must do
- Key dates and deadlines
- Payment obligations
- How either party can exit
- Important restrictions

Keep it concise but comprehensive. Use bullet points for clarity.

Extracted terms:
{{previousResult}}`,
    },
    {
      name: "Flag Risky Clauses",
      taskType: "reasoning",
      promptTemplate: `You are a legal risk analysis assistant. Review these contract terms and flag any clauses that could be problematic.

Evaluate risks including:
1. One-sided termination rights
2. Unlimited liability exposure
3. Overly broad non-compete/non-solicit
4. Automatic renewal traps
5. Vague deliverable definitions
6. Missing SLA or performance guarantees
7. Unfavorable IP assignment
8. Weak data protection provisions

For each risk found:
- Risk level (high/medium/low)
- Clause reference
- Plain-English explanation of the risk
- Suggested negotiation point

Extracted terms:
{{previousResult}}`,
    },
  ],
  meeting: [
    {
      name: "Structure Notes",
      taskType: "extraction",
      promptTemplate: `You are a meeting notes assistant. Transform these raw meeting notes into a well-structured format.

Organize into:
- Meeting metadata (date, attendees, topic)
- Agenda items discussed
- Key decisions made
- Discussion points per topic
- Open questions

Format as clean structured JSON.

Raw meeting notes:
{{input}}`,
    },
    {
      name: "Extract Action Items",
      taskType: "extraction",
      promptTemplate: `You are an action item extraction assistant. From these structured meeting notes, extract all action items.

For each action item:
- Description of the task
- Assignee (who is responsible)
- Deadline (if mentioned, otherwise "TBD")
- Priority (high/medium/low based on context)
- Related discussion topic

Be thorough - capture both explicit assignments and implied commitments.

Structured notes:
{{previousResult}}`,
    },
    {
      name: "Draft Follow-up Email",
      taskType: "creative",
      promptTemplate: `You are a professional communication assistant. Draft a follow-up email based on these meeting notes and action items.

The email should:
- Have a clear, professional subject line
- Thank attendees briefly
- Summarize key decisions (2-3 bullet points)
- List action items with owners and deadlines
- Note any upcoming meetings or next steps
- Be concise and scannable

Tone: Professional but friendly. No fluff.

Meeting notes and action items:
{{previousResult}}`,
    },
  ],
  image: [
    {
      name: "Describe Image",
      taskType: "vision",
      promptTemplate: `You are an image analysis assistant. Provide a detailed description of this image.

Include:
- Main subject/content
- Colors, composition, and style
- Text visible in the image
- Objects and their arrangement
- Overall mood/atmosphere
- Technical quality (lighting, focus, resolution)

Be specific and thorough - this description will be used for further analysis.

{{input}}`,
    },
    {
      name: "Generate SEO Alt-Text",
      taskType: "classification",
      promptTemplate: `You are an SEO specialist. Based on this image description, generate optimized alt-text variations.

Generate:
1. Short alt-text (under 125 characters) - for standard img tags
2. Medium description (1-2 sentences) - for Open Graph / social sharing
3. Long description (3-4 sentences) - for accessibility screen readers
4. SEO keywords (comma-separated list of relevant terms)

Follow alt-text best practices:
- Be descriptive but concise
- Include relevant keywords naturally
- Avoid "image of" or "picture of" prefixes
- Focus on the content and function

Image description:
{{previousResult}}`,
    },
    {
      name: "Brand Fit Analysis",
      taskType: "reasoning",
      promptTemplate: `You are a brand and marketing analyst. Evaluate this image for brand usage based on the description.

Analyze:
1. Professional quality score (1-10) with justification
2. Versatility - how many contexts could this image work in?
3. Emotional impact - what feelings does it evoke?
4. Target audience alignment - who would this resonate with?
5. Potential use cases (website hero, social media, presentation, etc.)
6. Improvements - what could make this image more effective?

Provide actionable recommendations for a marketing team.

Image description and alt-text:
{{previousResult}}`,
    },
  ],
};

// Model pricing per 1M tokens (used as fallback when actual cost isn't available)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "google/gemini-2.0-flash-001": { input: 0.1, output: 0.4 },
  "deepseek/deepseek-chat": { input: 0.14, output: 0.28 },
  "anthropic/claude-3.5-haiku": { input: 0.8, output: 4.0 },
  "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
  "openrouter/auto": { input: 1.0, output: 3.0 },
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

function estimateCost(
  modelId: string,
  usage: { prompt_tokens: number; completion_tokens: number }
): number {
  const pricing = MODEL_PRICING[modelId] ?? { input: 1.0, output: 3.0 };
  return (
    (usage.prompt_tokens / 1_000_000) * pricing.input +
    (usage.completion_tokens / 1_000_000) * pricing.output
  );
}

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
  model?: string;
}

async function callOpenRouter(
  model: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  apiKey: string
): Promise<{
  content: string;
  actualModel: string;
  latency: number;
  cost: number;
  promptTokens: number;
  completionTokens: number;
}> {
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://docroute.app",
          "X-Title": "DocRoute",
        },
        body: JSON.stringify({ model, messages, max_tokens: 2048 }),
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeout);
  }

  const latency = performance.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API error (${response.status}): ${errorText}`
    );
  }

  const data: OpenRouterResponse = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const actualModel = data.model ?? model;
  const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0 };
  const cost = estimateCost(actualModel, usage);

  return {
    content,
    actualModel,
    latency: Math.round(latency),
    cost,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
  };
}

export const backfillPrompts = action({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.runQuery(internal.tasks_internal.getAllTasks);
    let updated = 0;

    for (const task of tasks) {
      const prompts = PIPELINE_PROMPTS[task.feature];
      if (!prompts) continue;

      const steps = await ctx.runQuery(internal.tasks_internal.getTaskSteps, {
        taskId: task._id,
      });
      const sorted = steps.sort(
        (a: { stepNumber: number }, b: { stepNumber: number }) =>
          a.stepNumber - b.stepNumber
      );

      for (let i = 0; i < sorted.length; i++) {
        const step = sorted[i];
        if (step.prompt) continue; // already has prompt

        const promptDef = prompts[i];
        if (!promptDef) continue;

        let prompt = promptDef.promptTemplate;
        if (i === 0) {
          prompt = prompt.replace("{{input}}", task.inputText ?? "");
        } else {
          const prevResult = sorted[i - 1]?.result ?? "";
          prompt = prompt.replace("{{previousResult}}", prevResult);
        }

        await ctx.runMutation(internal.tasks.updateStep, {
          stepId: step._id,
          status: step.status,
          prompt,
        });
        updated++;
      }
    }

    return { updated };
  },
});

export const runPipeline = internalAction({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    // Get task info
    const task = await ctx.runQuery(internal.tasks_internal.getTask, {
      taskId: args.taskId,
    });
    if (!task) throw new Error(`Task ${args.taskId} not found`);

    // Mark task as running
    await ctx.runMutation(internal.tasks.markTaskRunning, {
      taskId: args.taskId,
    });

    // Get pipeline steps from DB
    const steps = await ctx.runQuery(internal.tasks_internal.getTaskSteps, {
      taskId: args.taskId,
    });
    const sortedSteps = steps.sort(
      (a: { stepNumber: number }, b: { stepNumber: number }) =>
        a.stepNumber - b.stepNumber
    );

    // Get pipeline prompts
    const pipelinePrompts = PIPELINE_PROMPTS[task.feature];
    if (!pipelinePrompts) {
      await ctx.runMutation(internal.tasks.failTask, {
        taskId: args.taskId,
      });
      return;
    }

    // Get input content
    let inputContent = task.inputText ?? "";
    let imageBase64: string | null = null;

    if (task.fileStorageId) {
      try {
        const url = await ctx.storage.getUrl(task.fileStorageId);
        if (url) {
          const fileResponse = await fetch(url);
          const buffer = await fileResponse.arrayBuffer();
          imageBase64 = Buffer.from(buffer).toString("base64");
          if (!inputContent) {
            inputContent = "[Image uploaded — see image content]";
          }
        }
      } catch {
        // If file fetch fails, continue with text-only
      }
    }

    let previousResult = "";
    let totalCost = 0;
    let totalLatency = 0;

    try {
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        const promptDef = pipelinePrompts[i];

        // Build prompt
        let prompt = promptDef.promptTemplate;
        if (i === 0) {
          prompt = prompt.replace("{{input}}", inputContent);
        } else {
          prompt = prompt.replace("{{previousResult}}", previousResult);
        }

        // Mark step as running (with the constructed prompt)
        await ctx.runMutation(internal.tasks.updateStep, {
          stepId: step._id,
          status: "running",
          prompt,
        });

        // Build messages
        const model = getModelForTask(step.taskType, task.mode);
        let messages: Array<{
          role: string;
          content:
            | string
            | Array<{
                type: string;
                text?: string;
                image_url?: { url: string };
              }>;
        }>;

        if (
          imageBase64 &&
          i === 0 &&
          (step.taskType === "vision" || model.includes("gemini") || model.includes("sonnet") || model === "openrouter/auto")
        ) {
          // Vision request with image
          messages = [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ];
        } else {
          messages = [{ role: "user", content: prompt }];
        }

        // Call OpenRouter
        const result = await callOpenRouter(model, messages, apiKey);

        if (!result.content.trim()) {
          throw new Error(
            `Model ${result.actualModel} returned empty content for step "${step.name}"`
          );
        }

        // Update step
        await ctx.runMutation(internal.tasks.updateStep, {
          stepId: step._id,
          status: "completed",
          actualModel: result.actualModel,
          latency: result.latency,
          cost: result.cost,
          result: result.content,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        });

        previousResult = result.content;
        totalCost += result.cost;
        totalLatency += result.latency;
      }

      // Mark task complete
      await ctx.runMutation(internal.tasks.completeTask, {
        taskId: args.taskId,
        totalCost,
        totalLatency,
      });
    } catch (error) {
      console.error("Pipeline error:", error);
      await ctx.runMutation(internal.tasks.failTask, {
        taskId: args.taskId,
      });
    }
  },
});
