// POST /api/ratings — Rate a post
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { verifyAuth, checkRole } from '@/lib/middleware/auth';
import { addRating } from '@/lib/services/ratingService';
import { validateRating } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/helpers';

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const roleError = checkRole(user, 'consumer');
    if (roleError) return roleError;

    const body = await request.json();
    const { isValid, errors } = validateRating(body);
    if (!isValid) return errorResponse('Validation failed', 400, errors);

    const rating = await addRating({
      postId: body.postId,
      userId: user.userId,
      score: body.score,
    });

    return successResponse(rating, 'Rating submitted');
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
