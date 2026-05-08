// ─── Post Service ───────────────────────────────────────────────────────────
// Orchestrates upload pipeline and provides feed/detail queries.
// ─────────────────────────────────────────────────────────────────────────────

import { getContainer } from '../config/database';
import { uploadImage } from './storageService';
import { analyzeImage } from './visionService';
import { moderateImage } from './moderationService';
import { generateId, now, sanitize } from '../helpers';
import type { Post, AuthPayload } from '../types';

export async function createPost(params: {
  user: AuthPayload;
  fileBuffer: Buffer;
  mimeType: string;
  caption: string;
  location?: string;
}): Promise<Post> {
  const postId = generateId();
  const container = getContainer('posts');

  // Step 1: Upload to Blob Storage
  const imageUrl = await uploadImage(params.user.userId, postId, params.fileBuffer, params.mimeType);

  // Step 2 & 3: Parallel AI processing
  const [moderationResult, visionResult] = await Promise.all([
    moderateImage(params.fileBuffer),
    analyzeImage(imageUrl),
  ]);

  // Step 4: Store post
  const post: Post = {
    id: postId,
    userId: params.user.userId,
    userName: params.user.displayName,
    imageUrl,
    caption: sanitize(params.caption),
    aiCaption: visionResult.aiCaption,
    tags: visionResult.tags,
    location: sanitize(params.location || ''),
    moderationStatus: moderationResult.moderationStatus,
    moderationDetails: {
      categories: moderationResult.categories,
      flaggedCategories: moderationResult.flaggedCategories,
    },
    commentCount: 0,
    averageRating: 0,
    ratingCount: 0,
    createdAt: now(),
  };

  await container.items.create(post);
  console.log(`✅ Post ${postId} created (${post.moderationStatus}, ${post.tags.length} tags)`);
  return post;
}

export async function getFeed(page: number, limit: number): Promise<{ posts: Post[]; total: number }> {
  const container = getContainer('posts');
  const offset = (page - 1) * limit;

  const { resources: countResult } = await container.items
    .query({ query: 'SELECT VALUE COUNT(1) FROM c WHERE c.moderationStatus = "safe"' })
    .fetchAll();
  const total = (countResult[0] as number) || 0;

  const { resources: posts } = await container.items
    .query({
      query: `SELECT * FROM c WHERE c.moderationStatus = "safe" 
              ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
      parameters: [
        { name: '@offset', value: offset },
        { name: '@limit', value: limit },
      ],
    })
    .fetchAll();

  return { posts: posts as Post[], total };
}

export async function getPostById(postId: string): Promise<Post> {
  const container = getContainer('posts');

  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: postId }],
    })
    .fetchAll();

  if (resources.length === 0) {
    const error = new Error('Post not found') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return resources[0] as Post;
}

export async function getMyPosts(userId: string, page: number, limit: number): Promise<{ posts: Post[]; total: number }> {
  const container = getContainer('posts');
  const offset = (page - 1) * limit;

  const { resources: countResult } = await container.items
    .query({
      query: 'SELECT VALUE COUNT(1) FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();
  const total = (countResult[0] as number) || 0;

  const { resources: posts } = await container.items
    .query({
      query: `SELECT * FROM c WHERE c.userId = @userId 
              ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@offset', value: offset },
        { name: '@limit', value: limit },
      ],
    })
    .fetchAll();

  return { posts: posts as Post[], total };
}
