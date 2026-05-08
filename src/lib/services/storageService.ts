// ─── Blob Storage Service ───────────────────────────────────────────────────

import { getContainerClient, isStorageConnected } from '../config/storage';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * In-memory image store for mock mode (maps URL to base64 data URI).
 */
const mockImageStore: Record<string, string> = {};

export async function uploadImage(
  userId: string,
  postId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = MIME_TO_EXT[mimeType] || 'jpg';
  const blobName = `posts/${userId}/${postId}.${ext}`;

  // Mock mode: store as base64 data URI served from /api/images/[id]
  if (!isStorageConnected()) {
    const base64 = fileBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;
    mockImageStore[postId] = dataUri;
    console.log(`📤 Image stored in memory: ${blobName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
    return `/api/images/${postId}`;
  }

  const containerClient = getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  console.log(`📤 Image uploaded: ${blobName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  return blockBlobClient.url;
}

export function getMockImage(postId: string): string | null {
  return mockImageStore[postId] || null;
}
