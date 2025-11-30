/**
 * ESTA Redis Package - Upstash Redis integration for ESTA Tracker
 *
 * This package provides Redis functionality for:
 * - Compliance leaderboard scoring and ranking
 * - Rate limiting for API requests
 * - Caching for expensive computations and predictions
 */

// Re-export Redis client
export { redis, Redis } from './client.js';

// Re-export leaderboard functions
export {
  updateComplianceScore,
  getTopFirms,
  type LeaderboardEntry,
} from './leaderboard.js';

// Re-export rate limiting functions
export {
  isRateLimited,
  getRateLimitCount,
  resetRateLimit,
  createRateLimitKey,
} from './rate-limit.js';

// Re-export caching functions
export {
  getCachedPrediction,
  getFromCache,
  setInCache,
  invalidateCache,
  createPredictionCacheKey,
  type CacheOptions,
} from './cache.js';
