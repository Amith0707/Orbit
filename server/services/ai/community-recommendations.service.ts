import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import { scoreCommunityCandidates, type CommunityScoreResult } from "../recommendations.service.js";
import {
  findFreshRecommendations,
  saveRecommendation,
  dismissRecommendation,
} from "../../repositories/ai-recommendations.repository.js";
import { findCommunityById, getMembership, countCommunityMembers } from "../../repositories/communities.repository.js";

const explanationSchema = z.object({
  explanations: z.array(
    z.object({
      communityId: z.string(),
      explanation: z
        .string()
        .min(10)
        .max(240)
        .describe("A specific, human-friendly reason this community was recommended, using only the facts given"),
    })
  ),
});

export interface CommunityRecommendation {
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  score: number;
  explanation: string;
}

function fallbackExplanation(c: CommunityScoreResult): string {
  const parts: string[] = [];
  const allShared = [...c.breakdown.sharedInterests, ...c.breakdown.sharedHobbies, ...c.breakdown.sharedSkills];
  if (allShared.length > 0) parts.push(`you're into ${allShared.slice(0, 2).join(" and ")}`);
  if (c.breakdown.coworkerCount > 0) parts.push(`${c.breakdown.coworkerCount} coworker(s) are already active here`);
  return parts.length > 0 ? `Recommended because ${parts.join(", and ")}.` : "A community that might be a great fit for you.";
}

const CACHE_HOURS = 24;

async function generateExplanations(candidates: CommunityScoreResult[]): Promise<Map<string, string>> {
  const prompt = candidates
    .map((c) => {
      const shared = [...c.breakdown.sharedInterests, ...c.breakdown.sharedHobbies, ...c.breakdown.sharedSkills];
      return [
        `Community ID: ${c.communityId}`,
        `Name: ${c.name}`,
        `Description: ${c.description ?? "none"}`,
        `Shared interests/hobbies/skills with this employee: ${shared.join(", ") || "none listed"}`,
        `Coworkers already active in this community: ${c.breakdown.coworkerCount}`,
        `Total members: ${c.memberCount}`,
      ].join("\n");
    })
    .join("\n\n");

  try {
    const result = await aiProvider.generateStructured({
      schema: explanationSchema,
      schemaName: "community_recommendations",
      system:
        "For each community below, write ONE short, warm, specific sentence explaining why it was recommended to this employee. Use ONLY the facts given — never invent shared interests or details. If there is little overlap, reference the community's description or their coworkers instead.",
      prompt,
      temperature: 0.7,
    });
    return new Map(result.explanations.map((e) => [e.communityId, e.explanation]));
  } catch (err) {
    console.error("Community recommendation explanation generation failed:", err);
    return new Map();
  }
}

export async function getCommunityRecommendations(userId: string, forceRegenerate = false): Promise<CommunityRecommendation[]> {
  if (!forceRegenerate) {
    const cached = await findFreshRecommendations(userId, "community", CACHE_HOURS);
    if (cached.length > 0) {
      const hydrated: CommunityRecommendation[] = [];
      for (const row of cached) {
        const community = await findCommunityById(row.target_id);
        if (!community || community.is_archived) continue;
        const membership = await getMembership(community.id, userId);
        if (membership) continue;
        hydrated.push({
          communityId: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          coverImageUrl: community.cover_image_url,
          memberCount: await countCommunityMembers(community.id),
          score: Number.parseFloat(row.score),
          explanation: row.ai_explanation ?? "",
        });
      }
      if (hydrated.length > 0) return hydrated;
    }
  }

  const candidates = await scoreCommunityCandidates(userId, 5);
  if (candidates.length === 0) return [];

  const explanations = await generateExplanations(candidates);

  const results: CommunityRecommendation[] = [];
  for (const c of candidates) {
    const explanation = explanations.get(c.communityId) ?? fallbackExplanation(c);
    await saveRecommendation({
      userId,
      type: "community",
      targetId: c.communityId,
      score: c.score,
      scoreBreakdown: c.breakdown,
      aiExplanation: explanation,
    });
    results.push({
      communityId: c.communityId,
      name: c.name,
      slug: c.slug,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      memberCount: c.memberCount,
      score: c.score,
      explanation,
    });
  }
  return results;
}

export async function dismissCommunityRecommendation(userId: string, communityId: string): Promise<void> {
  await dismissRecommendation(userId, "community", communityId);
}
