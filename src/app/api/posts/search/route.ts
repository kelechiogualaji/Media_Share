// GET /api/posts/search?q=query
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { verifyAuth, checkRole } from '@/lib/middleware/auth';
import { searchPosts } from '@/lib/services/searchService';
import { successResponse, errorResponse, getPaginationParams, buildPaginationMeta } from '@/lib/helpers';

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const roleError = checkRole(user, 'consumer');
    if (roleError) return roleError;

    const query = request.nextUrl.searchParams.get('q');
    if (!query || query.trim().length === 0) {
      return errorResponse('Search query "q" is required', 400);
    }

    const { page, limit } = getPaginationParams(request.nextUrl.searchParams);
    const { posts, total } = await searchPosts(query.trim(), page, limit);

    return successResponse(posts, `Search results for "${query}"`, {
      pagination: buildPaginationMeta(page, limit, total),
      query: query.trim(),
    });
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
