import { getProfile } from "../../users.service.js";
import type { ToolDefinition } from "../provider.js";

export const definition: ToolDefinition = {
  name: "get_user_profile_summary",
  description:
    "Get the employee's own profile: department, job title, bio, interests, hobbies, skills, and availability. Use this to personalize answers or when the user asks what you know about them.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
};

export async function handler(userId: string) {
  const profile = await getProfile(userId);
  return {
    firstName: profile.firstName,
    jobTitle: profile.jobTitle,
    department: profile.department?.name ?? null,
    bio: profile.bio,
    interests: profile.interests,
    hobbies: profile.hobbies,
    skills: profile.skills,
    availability: profile.availability,
  };
}
