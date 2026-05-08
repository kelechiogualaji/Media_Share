// GET /api/ratings/:postId
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { verifyAuth } from '@/lib/middleware/auth';
import { getRatings } from '@/lib/services/ratingService';
import { successResponse, errorResponse, getPaginationParams, buildPaginationMeta } from '@/lib/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const { postId } = await params;
    const { page, limit } = getPaginationParams(request.nextUrl.searchParams);
    const { ratings, total, stats } = await getRatings(postId, page, limit);

    return successResponse({ ratings, stats }, 'Ratings retrieved', {
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
