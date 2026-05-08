// GET /api/posts/:id — Single post by ID
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { verifyAuth } from '@/lib/middleware/auth';
import { getPostById } from '@/lib/services/postService';
import { successResponse, errorResponse } from '@/lib/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const { id } = await params;
    const post = await getPostById(id);

    return successResponse(post);
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
