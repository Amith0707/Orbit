import { supabase, unwrap } from "../db/supabase-client.js";

export interface PollRow {
  id: string;
  post_id: string | null;
  community_id: string | null;
  created_by: string | null;
  question: string;
  allow_multiple_choices: boolean;
  closes_at: string | null;
  is_closed: boolean;
  ai_summary: string | null;
  created_at: string;
}

export interface PollOptionRow {
  id: string;
  poll_id: string;
  label: string;
  display_order: number;
}

export async function createPollWithPost(input: {
  communityId: string;
  authorId: string;
  question: string;
  options: string[];
  allowMultipleChoices: boolean;
  closesAt?: Date;
}): Promise<{ poll: PollRow; options: PollOptionRow[]; postId: string }> {
  const result = unwrap(
    await supabase.rpc("create_poll_with_post", {
      p_community_id: input.communityId,
      p_author_id: input.authorId,
      p_question: input.question,
      p_options: input.options,
      p_allow_multiple: input.allowMultipleChoices,
      p_closes_at: input.closesAt?.toISOString() ?? null,
    })
  ) as { post_id: string; poll: PollRow; options: PollOptionRow[] };

  return { poll: result.poll, options: result.options, postId: result.post_id };
}

export async function findPollByPostId(postId: string): Promise<PollRow | null> {
  const rows = unwrap(await supabase.from("polls").select("*").eq("post_id", postId)) as unknown as PollRow[];
  return rows[0] ?? null;
}

export async function findPollById(pollId: string): Promise<PollRow | null> {
  const rows = unwrap(await supabase.from("polls").select("*").eq("id", pollId)) as unknown as PollRow[];
  return rows[0] ?? null;
}

export async function listPollOptions(pollId: string): Promise<PollOptionRow[]> {
  return unwrap(
    await supabase.from("poll_options").select("*").eq("poll_id", pollId).order("display_order", { ascending: true })
  ) as unknown as PollOptionRow[];
}

export interface OptionCount {
  poll_option_id: string;
  vote_count: string;
}

export async function countVotesByOption(pollId: string): Promise<OptionCount[]> {
  const rows = unwrap(
    await supabase.from("poll_votes").select("poll_option_id").eq("poll_id", pollId)
  ) as { poll_option_id: string }[];

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.poll_option_id, (counts.get(row.poll_option_id) ?? 0) + 1);
  }
  return [...counts.entries()].map(([poll_option_id, count]) => ({ poll_option_id, vote_count: String(count) }));
}

export async function getViewerVotes(pollId: string, userId: string): Promise<string[]> {
  const rows = unwrap(
    await supabase.from("poll_votes").select("poll_option_id").eq("poll_id", pollId).eq("user_id", userId)
  ) as { poll_option_id: string }[];
  return rows.map((r) => r.poll_option_id);
}

export async function countUniqueVoters(pollId: string): Promise<number> {
  const rows = unwrap(
    await supabase.from("poll_votes").select("user_id").eq("poll_id", pollId)
  ) as { user_id: string }[];
  return new Set(rows.map((r) => r.user_id)).size;
}

export async function castVote(pollId: string, userId: string, optionIds: string[], allowMultiple: boolean): Promise<void> {
  unwrap(
    await supabase.rpc("cast_poll_vote", {
      p_poll_id: pollId,
      p_user_id: userId,
      p_option_ids: optionIds,
      p_allow_multiple: allowMultiple,
    })
  );
}

export async function closePoll(pollId: string, aiSummary: string): Promise<PollRow> {
  const rows = unwrap(
    await supabase.from("polls").update({ is_closed: true, ai_summary: aiSummary }).eq("id", pollId).select("*")
  ) as unknown as PollRow[];
  return rows[0];
}
