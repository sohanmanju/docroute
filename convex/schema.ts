import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    feature: v.string(),
    mode: v.string(),
    groupId: v.string(),
    status: v.string(),
    totalCost: v.number(),
    totalLatency: v.number(),
    createdAt: v.number(),
    fileStorageId: v.optional(v.id("_storage")),
    inputText: v.optional(v.string()),
    qualityScore: v.optional(v.number()),
    qualityBreakdown: v.optional(v.string()),
    qualityStatus: v.optional(v.string()),
  })
    .index("by_groupId", ["groupId"])
    .index("by_feature", ["feature"])
    .index("by_createdAt", ["createdAt"]),

  steps: defineTable({
    taskId: v.id("tasks"),
    stepNumber: v.number(),
    name: v.string(),
    taskType: v.string(),
    status: v.string(),
    requestedModel: v.string(),
    actualModel: v.optional(v.string()),
    latency: v.optional(v.number()),
    cost: v.optional(v.number()),
    result: v.optional(v.string()),
    prompt: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_taskId", ["taskId"]),
});
