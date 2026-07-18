import { query, withTransaction } from "../db/client.js";

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
  return withTransaction(async (client) => {
    const postResult = await client.query<{ id: string }>(
      `INSERT INTO posts (community_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
      [input.communityId, input.authorId, input.question]
    );
    const postId = postResult.rows[0].id;

    const pollResult = await client.query<PollRow>(
      `INSERT INTO polls (post_id, community_id, created_by, question, allow_multiple_choices, closes_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [postId, input.communityId, input.authorId, input.question, input.allowMultipleChoices, input.closesAt ?? null]
    );
    const poll = pollResult.rows[0];

    const options: PollOptionRow[] = [];
    for (let i = 0; i < input.options.length; i += 1) {
      const optResult = await client.query<PollOptionRow>(
        `INSERT INTO poll_options (poll_id, label, display_order) VALUES ($1, $2, $3) RETURNING *`,
        [poll.id, input.options[i], i]
      );
      options.push(optResult.rows[0]);
    }

    return { poll, options, postId };
  });
}

export async function findPollByPostId(postId: string): Promise<PollRow | null> {
  const result = await query<PollRow>(`SELECT * FROM polls WHERE post_id = $1`, [postId]);
  return result.rows[0] ?? null;
}

export async function findPollById(pollId: string): Promise<PollRow | null> {
  const result = await query<PollRow>(`SELECT * FROM polls WHERE id = $1`, [pollId]);
  return result.rows[0] ?? null;
}

export async function listPollOptions(pollId: string): Promise<PollOptionRow[]> {
  const result = await query<PollOptionRow>(
    `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY display_order ASC`,
    [pollId]
  );
  return result.rows;
}

export interface OptionCount {
  poll_option_id: string;
  vote_count: string;
}

export async function countVotesByOption(pollId: string): Promise<OptionCount[]> {
  const result = await query<OptionCount>(
    `SELECT poll_option_id, COUNT(*) AS vote_count FROM poll_votes WHERE poll_id = $1 GROUP BY poll_option_id`,
    [pollId]
  );
  return result.rows;
}

export async function getViewerVotes(pollId: string, userId: string): Promise<string[]> {
  const result = await query<{ poll_option_id: string }>(
    `SELECT poll_option_id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
    [pollId, userId]
  );
  return result.rows.map((r) => r.poll_option_id);
}

export async function countUniqueVoters(pollId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT user_id) FROM poll_votes WHERE poll_id = $1`,
    [pollId]
  );
  return Number.parseInt(result.rows[0].count, 10);
}

export async function castVote(pollId: string, userId: string, optionIds: string[], allowMultiple: boolean): Promise<void> {
  await withTransaction(async (client) => {
    if (!allowMultiple) {
      await client.query(`DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2`, [pollId, userId]);
    } else {
      await client.query(
        `DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2 AND poll_option_id = ANY($3::uuid[])`,
        [pollId, userId, optionIds]
      );
    }
    for (const optionId of optionIds) {
      await client.query(
        `INSERT INTO poll_votes (poll_id, poll_option_id, user_id) VALUES ($1, $2, $3)
         ON CONFLICT (poll_id, poll_option_id, user_id) DO NOTHING`,
        [pollId, optionId, userId]
      );
    }
  });
}

export async function closePoll(pollId: string, aiSummary: string): Promise<PollRow> {
  const result = await query<PollRow>(
    `UPDATE polls SET is_closed = true, ai_summary = $2 WHERE id = $1 RETURNING *`,
    [pollId, aiSummary]
  );
  return result.rows[0];
}
