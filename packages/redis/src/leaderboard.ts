/**
 * ESTA Leaderboard - Compliance score ranking functionality
 *
 * This module provides functions to update and retrieve compliance scores
 * for firms, enabling a leaderboard of compliance performance.
 */

import { redis } from './client.js';

const LEADERBOARD_KEY = 'compliance:leaderboard';

/**
 * Update a firm's compliance score in the leaderboard.
 * Lower denial rates result in higher rankings (score is negated for sorting).
 *
 * @param firmId - The unique identifier of the firm
 * @param score - The compliance score (e.g., denial rate)
 */
export async function updateComplianceScore(
  firmId: string,
  score: number
): Promise<void> {
  await redis.zadd(LEADERBOARD_KEY, { score: -score, member: firmId });
}

/**
 * Leaderboard entry with firm ID and score
 */
export interface LeaderboardEntry {
  member: string;
  score: number;
}

/**
 * Get the top firms from the compliance leaderboard.
 *
 * @param limit - Maximum number of firms to return (default: 100)
 * @returns Array of firm IDs with their scores
 */
export async function getTopFirms(limit = 100): Promise<LeaderboardEntry[]> {
  const results = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, limit - 1, {
    withScores: true,
  });

  // Convert flat array [member1, score1, member2, score2, ...] to objects
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < results.length; i += 2) {
    const member = results[i];
    const score = results[i + 1];
    if (typeof member === 'string' && score !== undefined) {
      entries.push({
        member,
        score: typeof score === 'string' ? parseFloat(score) : Number(score),
      });
    }
  }
  return entries;
}
