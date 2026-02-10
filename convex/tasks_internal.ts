import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getTask = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const getTaskSteps = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("steps")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const getAllTasks = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});
