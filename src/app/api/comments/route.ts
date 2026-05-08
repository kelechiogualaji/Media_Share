// POST /api/comments — Add comment
// GET  /api/comments — (not used, see /api/comments/:postId)
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { verifyAuth, checkRole } from '@/lib/middleware/auth';
import { addComment } from '@/lib/services/commentService';
import { validateComment } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/helpers';

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const roleError = checkRole(user, 'consumer');
    if (roleError) return roleError;

    const body = await request.json();
    const { isValid, errors } = validateComment(body);
    if (!isValid) return errorResponse('Validation failed', 400, errors);

    const comment = await addComment({
      postId: body.postId,
      userId: user.userId,
      userName: user.displayName,
      text: body.text,
    });

    return successResponse(comment, 'Comment added');
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
