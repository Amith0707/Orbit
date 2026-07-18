import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import * as challengesRepo from "../../repositories/challenges.repository.js";
import * as communitiesService from "../communities.service.js";
import { toChallengeDTO } from "../challenges.service.js";
import { findCommunityBySlug } from "../../repositories/communities.repository.js";
import { getCommunityTags } from "../../repositories/tags.repository.js";
import { AppError } from "../../utils/app-error.js";

const challengeSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(1000).describe("A fun, motivating description of the challenge and how to participate"),
  goalMetric: z.string().min(2).max(120).optional().describe("What participants are tracking, e.g. 'photos submitted' or 'puzzles solved'"),
  goalTarget: z.number().positive().optional(),
  durationDays: z.number().int().positive().max(30).describe("How many days the challenge should run, typically 7 for a weekly challenge"),
});

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function generateChallenge(slug: string, userId: string) {
  const community = await findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  await communitiesService.requireMembership(community.id, userId, ["moderator", "owner"]);

  const [tags, recentTitles] = await Promise.all([
    getCommunityTags(community.id),
    challengesRepo.getRecentTitlesForCommunity(community.id),
  ]);

  const prompt = [
    `Community name: ${community.name}`,
    `Community description: ${community.description ?? "none"}`,
    `Community themes/tags: ${tags.map((t) => t.name).join(", ") || "none"}`,
    `Recently used challenge titles to avoid repeating: ${recentTitles.join(", ") || "none"}`,
  ].join("\n");

  const ai = await aiProvider.generateStructured({
    schema: challengeSchema,
    schemaName: "community_challenge",
    system:
      "Generate one fun, engaging weekly challenge that matches this community's theme (examples: a photography challenge, a fitness challenge, a chess puzzle, a gaming tournament, a book discussion, a cooking challenge). Make it specific and actionable, not generic. Do not repeat any recently used title.",
    prompt,
    temperature: 0.9,
  });

  const challenge = await challengesRepo.createChallenge({
    communityId: community.id,
    createdBy: userId,
    title: ai.title,
    description: ai.description,
    goalMetric: ai.goalMetric,
    goalTarget: ai.goalTarget,
    startsAt: dateOffset(0),
    endsAt: dateOffset(ai.durationDays),
    status: "draft",
    source: "ai_generated",
    aiRawResponse: ai,
  });

  return toChallengeDTO(challenge, 0);
}
