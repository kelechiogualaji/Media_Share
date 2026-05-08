// ─── Rating Service ─────────────────────────────────────────────────────────

import { getContainer } from '../config/database';
import { generateId, now } from '../helpers';
import type { Rating } from '../types';

export async function addRating(params: {
  postId: string;
  userId: string;
  score: number;
}): Promise<Rating> {
  const ratingContainer = getContainer('ratings');
  const postContainer = getContainer('posts');

  // Verify post exists
  const { resources: posts } = await postContainer.items
    .query({
      query: 'SELECT c.id, c.userId FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: params.postId }],
    })
    .fetchAll();

  if (posts.length === 0) {
    const error = new Error('Post not found') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const post = posts[0] as { id: string; userId: string };

  // Check for existing rating
  const { resources: existing } = await ratingContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.postId = @postId AND c.userId = @userId',
      parameters: [
        { name: '@postId', value: params.postId },
        { name: '@userId', value: params.userId },
      ],
    })
    .fetchAll();

  let rating: Rating;

  if (existing.length > 0) {
    rating = existing[0] as Rating;
    rating.score = params.score;
    rating.updatedAt = now();
    await ratingContainer.item(rating.id, params.postId).replace(rating);
  } else {
    rating = {
      id: generateId(),
      postId: params.postId,
      userId: params.userId,
      score: params.score,
      createdAt: now(),
    };
    await ratingContainer.items.create(rating);
  }

  // Recalculate average
  await updatePostRatingStats(params.postId, post.userId);
  return rating;
}

async function updatePostRatingStats(postId: string, postUserId: string) {
  const ratingContainer = getContainer('ratings');
  const postContainer = getContainer('posts');

  try {
    const { resources } = await ratingContainer.items
      .query({
        query: `SELECT VALUE { "count": COUNT(1), "avg": AVG(c.score) } FROM c WHERE c.postId = @postId`,
        parameters: [{ name: '@postId', value: postId }],
      })
      .fetchAll();

    const stats = (resources[0] as { count: number; avg: number }) || { count: 0, avg: 0 };

    await postContainer
      .item(postId, postUserId)
      .patch([
        { op: 'set', path: '/ratingCount', value: stats.count },
        { op: 'set', path: '/averageRating', value: Math.round(stats.avg * 10) / 10 },
      ]);
  } catch (err) {
    console.warn('Failed to update rating stats:', err);
  }
}

export async function getRatings(
  postId: string,
  page: number,
  limit: number
): Promise<{ ratings: Rating[]; total: number; stats: { averageRating: number; totalRatings: number } }> {
  const ratingContainer = getContainer('ratings');
  const offset = (page - 1) * limit;

  const { resources: countResult } = await ratingContainer.items
    .query({
      query: 'SELECT VALUE COUNT(1) FROM c WHERE c.postId = @postId',
      parameters: [{ name: '@postId', value: postId }],
    })
    .fetchAll();
  const total = (countResult[0] as number) || 0;

  const { resources: ratings } = await ratingContainer.items
    .query({
      query: `SELECT * FROM c WHERE c.postId = @postId ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
      parameters: [
        { name: '@postId', value: postId },
        { name: '@offset', value: offset },
        { name: '@limit', value: limit },
      ],
    })
    .fetchAll();

  const { resources: statsResult } = await ratingContainer.items
    .query({
      query: `SELECT VALUE { "average": AVG(c.score), "count": COUNT(1) } FROM c WHERE c.postId = @postId`,
      parameters: [{ name: '@postId', value: postId }],
    })
    .fetchAll();

  const s = (statsResult[0] as { average: number; count: number }) || { average: 0, count: 0 };

  return {
    ratings: ratings as Rating[],
    total,
    stats: {
      averageRating: Math.round((s.average || 0) * 10) / 10,
      totalRatings: s.count || 0,
    },
  };
}
