// ─── Comment Service ────────────────────────────────────────────────────────

import { getContainer } from '../config/database';
import { generateId, now, sanitize } from '../helpers';
import type { Comment } from '../types';

export async function addComment(params: {
  postId: string;
  userId: string;
  userName: string;
  text: string;
}): Promise<Comment> {
  const commentContainer = getContainer('comments');
  const postContainer = getContainer('posts');

  // Verify post exists
  const { resources: posts } = await postContainer.items
    .query({
      query: 'SELECT c.id, c.userId, c.commentCount FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: params.postId }],
    })
    .fetchAll();

  if (posts.length === 0) {
    const error = new Error('Post not found') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const post = posts[0] as { id: string; userId: string; commentCount: number };

  const comment: Comment = {
    id: generateId(),
    postId: params.postId,
    userId: params.userId,
    userName: params.userName,
    text: sanitize(params.text),
    createdAt: now(),
  };

  await commentContainer.items.create(comment);

  // Update denormalized count
  try {
    await postContainer
      .item(post.id, post.userId)
      .patch([{ op: 'incr', path: '/commentCount', value: 1 }]);
  } catch (err) {
    console.warn('Failed to increment commentCount:', err);
  }

  return comment;
}

export async function getComments(
  postId: string,
  page: number,
  limit: number
): Promise<{ comments: Comment[]; total: number }> {
  const container = getContainer('comments');
  const offset = (page - 1) * limit;

  const { resources: countResult } = await container.items
    .query({
      query: 'SELECT VALUE COUNT(1) FROM c WHERE c.postId = @postId',
      parameters: [{ name: '@postId', value: postId }],
    })
    .fetchAll();
  const total = (countResult[0] as number) || 0;

  const { resources: comments } = await container.items
    .query({
      query: `SELECT * FROM c WHERE c.postId = @postId ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
      parameters: [
        { name: '@postId', value: postId },
        { name: '@offset', value: offset },
        { name: '@limit', value: limit },
      ],
    })
    .fetchAll();

  return { comments: comments as Comment[], total };
}
