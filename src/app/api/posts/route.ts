// POST /api/posts — Create post (Creator only)
// GET  /api/posts — Paginated feed
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { verifyAuth, checkRole } from '@/lib/middleware/auth';
import { createPost, getFeed } from '@/lib/services/postService';
import { successResponse, errorResponse, getPaginationParams, buildPaginationMeta } from '@/lib/helpers';
import { config } from '@/lib/config/environment';

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const roleError = checkRole(user, 'creator');
    if (roleError) return roleError;

    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) return errorResponse('An image file is required', 400);

    // Validate file type and size
    if (!(config.upload.allowedMimeTypes as readonly string[]).includes(imageFile.type)) {
      return errorResponse(`Invalid file type. Allowed: ${config.upload.allowedMimeTypes.join(', ')}`, 400);
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    if (arrayBuffer.byteLength > config.upload.maxFileSize) {
      return errorResponse('File too large. Maximum size is 10MB.', 413);
    }

    const caption = formData.get('caption') as string;
    if (!caption || caption.trim().length === 0) {
      return errorResponse('Caption is required', 400);
    }

    const fileBuffer = Buffer.from(arrayBuffer);

    const post = await createPost({
      user,
      fileBuffer,
      mimeType: imageFile.type,
      caption,
      location: (formData.get('location') as string) || '',
    });

    return successResponse(post, 'Post created successfully');
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    const { user, error: authError } = verifyAuth(request);
    if (authError || !user) return authError!;

    const { page, limit } = getPaginationParams(request.nextUrl.searchParams);
    const { posts, total } = await getFeed(page, limit);

    return successResponse(posts, 'Feed retrieved', {
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
