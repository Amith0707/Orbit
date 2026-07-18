import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import { scoreCommunityCandidates, scoreCoworkerCandidates } from "../recommendations.service.js";
import { listUpcomingForUser } from "../events.service.js";
import { notifyUser } from "../notifications.service.js";
import {
  findDigestForWeek,
  createDigest,
  listRecentDigests,
  countNewPostsForUserCommunities,
  listActiveChallengesForUserCommunities,
  type WeeklyDigestRow,
} from "../../repositories/weekly-digests.repository.js";

const digestSchema = z.object({
  narrative: z
    .string()
    .min(40)
    .max(1400)
    .describe(
      "A warm, conversational weekly digest addressed directly to the employee (2nd person, 'you'). Reference only the facts provided — communities, events, coworkers, challenges, and activity counts. Organize it as a few short friendly paragraphs, not a bulleted stats dump."
    ),
});

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toDigestDTO(row: WeeklyDigestRow) {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    stats: row.stats,
    narrative: row.narrative,
    createdAt: row.created_at,
  };
}

export async function getOrGenerateWeeklyDigest(userId: string, forceRegenerate = false) {
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = toDateStr(weekStart);
  const weekEndStr = toDateStr(weekEnd);

  if (!forceRegenerate) {
    const existing = await findDigestForWeek(userId, weekStartStr);
    if (existing) return toDigestDTO(existing);
  }

  const [communityCandidates, coworkerCandidates, upcomingEvents, newPostsCount, activeChallenges] = await Promise.all([
    scoreCommunityCandidates(userId, 3),
    scoreCoworkerCandidates(userId, 3),
    listUpcomingForUser(userId, 5),
    countNewPostsForUserCommunities(userId, weekStartStr),
    listActiveChallengesForUserCommunities(userId, 3),
  ]);

  const stats = {
    newPostsCount,
    recommendedCommunities: communityCandidates.map((c) => ({
      name: c.name,
      sharedTags: [...c.breakdown.sharedInterests, ...c.breakdown.sharedHobbies, ...c.breakdown.sharedSkills],
    })),
    suggestedCoworkers: coworkerCandidates.map((c) => ({
      name: `${c.firstName} ${c.lastName}`,
      sharedTags: [...c.breakdown.sharedInterests, ...c.breakdown.sharedHobbies, ...c.breakdown.sharedSkills],
    })),
    upcomingEvents: upcomingEvents.map((e) => ({ title: e.title, startsAt: e.startsAt, communityName: e.communityName })),
    activeChallenges: activeChallenges.map((c) => ({ title: c.title, communityName: c.community_name })),
  };

  const prompt = [
    `New posts this week in the employee's communities: ${stats.newPostsCount}`,
    `Recommended communities: ${stats.recommendedCommunities.map((c) => `${c.name} (shared: ${c.sharedTags.join(", ") || "coworker overlap"})`).join("; ") || "none"}`,
    `Suggested coworkers to connect with: ${stats.suggestedCoworkers.map((c) => `${c.name} (shared: ${c.sharedTags.join(", ") || "similar background"})`).join("; ") || "none"}`,
    `Upcoming events: ${stats.upcomingEvents.map((e) => `${e.title} on ${e.startsAt}${e.communityName ? ` (${e.communityName})` : ""}`).join("; ") || "none"}`,
    `Active weekly challenges: ${stats.activeChallenges.map((c) => `${c.title} in ${c.communityName}`).join("; ") || "none"}`,
  ].join("\n");

  let narrative: string;
  try {
    const ai = await aiProvider.generateStructured({
      schema: digestSchema,
      schemaName: "weekly_digest",
      system:
        "Write this employee's personalized weekly digest for Calfus Orbit, an employee community platform. Be warm and conversational, like a friendly companion catching them up — not a stats report. Use ONLY the facts given; if a section has no data, skip it gracefully rather than inventing something.",
      prompt,
      temperature: 0.75,
    });
    narrative = ai.narrative;
  } catch (err) {
    console.error("Weekly digest narrative generation failed:", err);
    narrative = `This week: ${stats.newPostsCount} new posts in your communities, ${stats.upcomingEvents.length} upcoming events, and ${stats.recommendedCommunities.length} communities you might enjoy. Check them out!`;
  }

  const digest = await createDigest({ userId, weekStart: weekStartStr, weekEnd: weekEndStr, stats, narrative });

  await notifyUser({
    userId,
    type: "digest_ready",
    title: "Your weekly digest is ready",
    body: narrative.slice(0, 140),
    linkUrl: "/digest",
  });

  return toDigestDTO(digest);
}

export async function getDigestHistory(userId: string) {
  const digests = await listRecentDigests(userId);
  return digests.map(toDigestDTO);
}
