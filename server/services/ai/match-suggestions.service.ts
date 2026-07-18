import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import { scoreCoworkerCandidates, type CoworkerScoreResult } from "../recommendations.service.js";
import {
  findFreshRecommendations,
  saveRecommendation,
  dismissRecommendation,
} from "../../repositories/ai-recommendations.repository.js";
import { findUserById } from "../../repositories/users.repository.js";

const explanationSchema = z.object({
  explanations: z.array(
    z.object({
      userId: z.string(),
      explanation: z
        .string()
        .min(10)
        .max(240)
        .describe("A specific, warm reason these two coworkers would likely enjoy connecting, using only the facts given"),
    })
  ),
});

export interface MatchSuggestion {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  score: number;
  explanation: string;
}

function fallbackExplanation(c: CoworkerScoreResult): string {
  const shared = [...c.breakdown.sharedInterests, ...c.breakdown.sharedHobbies, ...c.breakdown.sharedSkills];
  if (shared.length > 0) return `You both share an interest in ${shared.slice(0, 2).join(" and ")}.`;
  if (c.breakdown.sameDepartment) return `You're both in ${c.breakdown.departmentName ?? "the same department"}.`;
  return "Someone new worth connecting with.";
}

const CACHE_HOURS = 24;

async function generateExplanations(candidates: CoworkerScoreResult[]): Promise<Map<string, string>> {
  const prompt = candidates
    .map((c) => {
      const shared = [...c.breakdown.sharedInterests, ...c.breakdown.sharedHobbies, ...c.breakdown.sharedSkills];
      return [
        `User ID: ${c.userId}`,
        `Name: ${c.firstName} ${c.lastName}`,
        `Job title: ${c.jobTitle ?? "unknown"}`,
        `Same department as viewer: ${c.breakdown.sameDepartment ? `yes (${c.breakdown.departmentName})` : "no"}`,
        `Shared interests/hobbies/skills: ${shared.join(", ") || "none listed"}`,
        `Communities in common: ${c.breakdown.sharedCommunityCount}`,
        `Upcoming events both are attending: ${c.breakdown.sharedUpcomingEventCount}`,
      ].join("\n");
    })
    .join("\n\n");

  try {
    const result = await aiProvider.generateStructured({
      schema: explanationSchema,
      schemaName: "match_suggestions",
      system:
        "For each coworker below, write ONE short, warm sentence explaining why the viewer would likely enjoy connecting with them. Use ONLY the facts given — never invent shared interests or details.",
      prompt,
      temperature: 0.7,
    });
    return new Map(result.explanations.map((e) => [e.userId, e.explanation]));
  } catch (err) {
    console.error("Match suggestion explanation generation failed:", err);
    return new Map();
  }
}

export async function getMatchSuggestions(userId: string, forceRegenerate = false): Promise<MatchSuggestion[]> {
  if (!forceRegenerate) {
    const cached = await findFreshRecommendations(userId, "match", CACHE_HOURS);
    if (cached.length > 0) {
      const hydrated: MatchSuggestion[] = [];
      for (const row of cached) {
        const candidate = await findUserById(row.target_id);
        if (!candidate || !candidate.is_active) continue;
        hydrated.push({
          userId: candidate.id,
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          avatarUrl: candidate.avatar_url,
          jobTitle: candidate.job_title,
          score: Number.parseFloat(row.score),
          explanation: row.ai_explanation ?? "",
        });
      }
      if (hydrated.length > 0) return hydrated;
    }
  }

  const candidates = await scoreCoworkerCandidates(userId, 5);
  if (candidates.length === 0) return [];

  const explanations = await generateExplanations(candidates);

  const results: MatchSuggestion[] = [];
  for (const c of candidates) {
    const explanation = explanations.get(c.userId) ?? fallbackExplanation(c);
    await saveRecommendation({
      userId,
      type: "match",
      targetId: c.userId,
      score: c.score,
      scoreBreakdown: c.breakdown,
      aiExplanation: explanation,
    });
    results.push({
      userId: c.userId,
      firstName: c.firstName,
      lastName: c.lastName,
      avatarUrl: c.avatarUrl,
      jobTitle: c.jobTitle,
      score: c.score,
      explanation,
    });
  }
  return results;
}

export async function dismissMatchSuggestion(userId: string, targetUserId: string): Promise<void> {
  await dismissRecommendation(userId, "match", targetUserId);
}
