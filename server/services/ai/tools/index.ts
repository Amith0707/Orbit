import type { ToolDefinition } from "../provider.js";
import * as getRecommendedCommunities from "./get-recommended-communities.js";
import * as getUpcomingEvents from "./get-upcoming-events.js";
import * as findSimilarCoworkers from "./find-similar-coworkers.js";
import * as getUserProfileSummary from "./get-user-profile-summary.js";

interface RegisteredTool {
  definition: ToolDefinition;
  // The handler always receives the server-authenticated userId, never a model-supplied one —
  // this is what stops the model from being prompted into fetching another user's data.
  handler: (userId: string) => Promise<unknown>;
}

const registry: Record<string, RegisteredTool> = {
  [getRecommendedCommunities.definition.name]: getRecommendedCommunities,
  [getUpcomingEvents.definition.name]: getUpcomingEvents,
  [findSimilarCoworkers.definition.name]: findSimilarCoworkers,
  [getUserProfileSummary.definition.name]: getUserProfileSummary,
};

export function getToolDefinitions(): ToolDefinition[] {
  return Object.values(registry).map((t) => t.definition);
}

export async function executeTool(name: string, userId: string): Promise<unknown> {
  const tool = registry[name];
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    return await tool.handler(userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Tool execution failed" };
  }
}
