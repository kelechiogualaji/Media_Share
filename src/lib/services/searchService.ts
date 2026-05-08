// ─── Search Service ─────────────────────────────────────────────────────────

import { getContainer } from '../config/database';
import type { Post } from '../types';

export async function searchPosts(
  query: string,
  page: number,
  limit: number
): Promise<{ posts: Post[]; total: number }> {
  const container = getContainer('posts');
  const offset = (page - 1) * limit;

  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 10);

  if (tokens.length === 0) return { posts: [], total: 0 };

  const conditions = tokens.map((_, i) =>
    `(ARRAY_CONTAINS(c.tags, @token${i}) OR CONTAINS(LOWER(c.caption), @token${i}) OR CONTAINS(LOWER(c.aiCaption), @token${i}) OR CONTAINS(LOWER(c.location), @token${i}))`
  );

  const whereClause = `c.moderationStatus = "safe" AND (${conditions.join(' OR ')})`;
  const parameters = tokens.map((token, i) => ({ name: `@token${i}`, value: token }));

  const { resources: countResult } = await container.items
    .query({ query: `SELECT VALUE COUNT(1) FROM c WHERE ${whereClause}`, parameters })
    .fetchAll();
  const total = (countResult[0] as number) || 0;

  const { resources: posts } = await container.items
    .query({
      query: `SELECT * FROM c WHERE ${whereClause} ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
      parameters: [
        ...parameters,
        { name: '@offset', value: offset },
        { name: '@limit', value: limit },
      ],
    })
    .fetchAll();

  return { posts: posts as Post[], total };
}
