import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import { computeTagOverlap } from "../recommendations.service.js";
import { getProfile } from "../users.service.js";
import {
  findFreshRecommendationForTarget,
  saveRecommendation,
} from "../../repositories/ai-recommendations.repository.js";
import { AppError } from "../../utils/app-error.js";

const iceBreakerSchema = z.object({
  commonalities: z
    .array(z.string().min(3).max(180))
    .min(1)
    .max(4)
    .describe("Short, specific observations about what these two coworkers have in common, based only on the facts provided"),
  conversationStarters: z
    .array(z.string().min(3).max(220))
    .min(2)
    .max(4)
    .describe("Natural, friendly opening lines or questions the viewer could use to start a conversation with the other person"),
});

interface IceBreakerFacts {
  sharedInterests: string[];
  sharedHobbies: string[];
  sharedSkills: string[];
  viewerName: string;
  targetName: string;
  viewerDepartment: string | null;
  targetDepartment: string | null;
  sameDepartment: boolean;
  viewerBio: string | null;
  targetBio: string | null;
}

function buildFactsPrompt(facts: IceBreakerFacts): string {
  const lines = [
    `Viewer: ${facts.viewerName}${facts.viewerDepartment ? ` (${facts.viewerDepartment})` : ""}`,
    `Coworker: ${facts.targetName}${facts.targetDepartment ? ` (${facts.targetDepartment})` : ""}`,
    facts.sameDepartment ? "They are in the same department." : "They are in different departments.",
    `Shared interests: ${facts.sharedInterests.join(", ") || "none listed"}`,
    `Shared hobbies: ${facts.sharedHobbies.join(", ") || "none listed"}`,
    `Shared skills: ${facts.sharedSkills.join(", ") || "none listed"}`,
  ];
  if (facts.targetBio) lines.push(`Coworker's bio: ${facts.targetBio}`);
  if (facts.viewerBio) lines.push(`Viewer's bio: ${facts.viewerBio}`);
  return lines.join("\n");
}

export interface IceBreakerResult {
  targetUserId: string;
  sharedInterests: string[];
  sharedHobbies: string[];
  sharedSkills: string[];
  commonalities: string[];
  conversationStarters: string[];
  cached: boolean;
}

const CACHE_HOURS = 24 * 3;

export async function getIceBreaker(viewerId: string, targetUserId: string, forceRegenerate = false): Promise<IceBreakerResult> {
  if (viewerId === targetUserId) {
    throw AppError.badRequest("Ice breakers are only available when viewing a coworker's profile");
  }

  if (!forceRegenerate) {
    const cached = await findFreshRecommendationForTarget(viewerId, "ice_breaker", targetUserId, CACHE_HOURS);
    if (cached) {
      const breakdown = cached.score_breakdown as unknown as {
        sharedInterests: string[];
        sharedHobbies: string[];
        sharedSkills: string[];
        commonalities: string[];
        conversationStarters: string[];
      };
      return { targetUserId, ...breakdown, cached: true };
    }
  }

  const [viewerProfile, targetProfile, overlap] = await Promise.all([
    getProfile(viewerId),
    getProfile(targetUserId),
    computeTagOverlap(viewerId, targetUserId),
  ]);

  const facts: IceBreakerFacts = {
    sharedInterests: overlap.sharedInterests,
    sharedHobbies: overlap.sharedHobbies,
    sharedSkills: overlap.sharedSkills,
    viewerName: viewerProfile.firstName,
    targetName: targetProfile.firstName,
    viewerDepartment: viewerProfile.department?.name ?? null,
    targetDepartment: targetProfile.department?.name ?? null,
    sameDepartment: Boolean(viewerProfile.department && targetProfile.department?.id === viewerProfile.department?.id),
    viewerBio: viewerProfile.bio,
    targetBio: targetProfile.bio,
  };

  const aiResult = await aiProvider.generateStructured({
    schema: iceBreakerSchema,
    schemaName: "ice_breaker",
    system:
      "You help coworkers break the ice. Use ONLY the facts given below — never invent shared interests, hobbies, or details that weren't provided. If there is little overlap, lean on department, bio, or the fact that they haven't connected yet. Be warm and specific, not generic.",
    prompt: buildFactsPrompt(facts),
    temperature: 0.8,
  });

  const overlapCount = facts.sharedInterests.length + facts.sharedHobbies.length + facts.sharedSkills.length;
  const score = Math.max(0.1, Math.min(1, overlapCount * 0.2 + (facts.sameDepartment ? 0.2 : 0)));

  await saveRecommendation({
    userId: viewerId,
    type: "ice_breaker",
    targetId: targetUserId,
    score,
    scoreBreakdown: {
      sharedInterests: facts.sharedInterests,
      sharedHobbies: facts.sharedHobbies,
      sharedSkills: facts.sharedSkills,
      commonalities: aiResult.commonalities,
      conversationStarters: aiResult.conversationStarters,
    },
    aiExplanation: aiResult.commonalities[0] ?? "",
  });

  return {
    targetUserId,
    sharedInterests: facts.sharedInterests,
    sharedHobbies: facts.sharedHobbies,
    sharedSkills: facts.sharedSkills,
    commonalities: aiResult.commonalities,
    conversationStarters: aiResult.conversationStarters,
    cached: false,
  };
}
