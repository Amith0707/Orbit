import { scoreCoworkerCandidates } from "../../recommendations.service.js";
import type { ToolDefinition } from "../provider.js";

export const definition: ToolDefinition = {
  name: "find_similar_coworkers",
  description:
    "Find coworkers who share interests, hobbies, skills, department, or communities with the employee. Use this when the user asks to meet new people or find coworkers with similar interests.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
};

export async function handler(userId: string) {
  const candidates = await scoreCoworkerCandidates(userId, 5);
  return candidates.map((c) => ({
    name: `${c.firstName} ${c.lastName}`,
    jobTitle: c.jobTitle,
    sameDepartment: c.breakdown.sameDepartment,
    departmentName: c.breakdown.departmentName,
    sharedInterests: c.breakdown.sharedInterests,
    sharedHobbies: c.breakdown.sharedHobbies,
    sharedSkills: c.breakdown.sharedSkills,
    sharedCommunityCount: c.breakdown.sharedCommunityCount,
  }));
}
