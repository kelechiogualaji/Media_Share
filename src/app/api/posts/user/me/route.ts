// GET /api/posts/user/me — Creator's own posts
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { verifyAuth, checkRole } from '@/lib/middleware/auth';
import { getMyPosts } from '@/lib/services/postService';
import { successResponse, errorResponse, getPaginationParams, buildPaginationMeta } from '@/lib/helpers';

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const roleError = checkRole(user, 'creator');
    if (roleError) return roleError;

    const { page, limit } = getPaginationParams(request.nextUrl.searchParams);
    const { posts, total } = await getMyPosts(user.userId, page, limit);

    return successResponse(posts, 'Your posts', {
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
