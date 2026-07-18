import { scoreCommunityCandidates } from "../../recommendations.service.js";
import type { ToolDefinition } from "../provider.js";

export const definition: ToolDefinition = {
  name: "get_recommended_communities",
  description:
    "Get communities the employee has not joined yet that best match their interests, hobbies, skills, and coworker overlap. Use this when the user asks for community recommendations.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
};

export async function handler(userId: string) {
  const candidates = await scoreCommunityCandidates(userId, 5);
  return candidates.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    memberCount: c.memberCount,
    sharedInterests: c.breakdown.sharedInterests,
    sharedHobbies: c.breakdown.sharedHobbies,
    sharedSkills: c.breakdown.sharedSkills,
    coworkersInCommunity: c.breakdown.coworkerCount,
  }));
}
