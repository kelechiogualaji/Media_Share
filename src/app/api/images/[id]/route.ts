// GET /api/images/:id — Serve mock-stored images in dev mode
import { NextRequest, NextResponse } from 'next/server';
import { getMockImage } from '@/lib/services/storageService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dataUri = getMockImage(id);

  if (!dataUri) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  // Parse the data URI: data:image/jpeg;base64,<data>
  const match = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid image data' }, { status: 500 });
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
