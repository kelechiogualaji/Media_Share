// ─── AI Vision Service ──────────────────────────────────────────────────────

import { getVisionClient } from '../config/vision';
import type { VisionResult } from '../types';

export async function analyzeImage(imageUrl: string): Promise<VisionResult> {
  const client = getVisionClient();

  if (!client) {
    return { tags: ['photo', 'image', 'uploaded'], aiCaption: 'An uploaded image', confidence: 0 };
  }

  try {
    const result = await client.path('/imageanalysis:analyze').post({
      body: { url: imageUrl },
      queryParameters: {
        features: ['Caption', 'Tags'],
        language: 'en',
        'gender-neutral-caption': true,
      },
      contentType: 'application/json',
    });

    if (result.status !== '200') {
      console.error('Vision API error:', result.body);
      throw new Error(`Vision API returned status ${result.status}`);
    }

    const body = result.body as {
      tagsResult?: { values: Array<{ name: string; confidence: number }> };
      captionResult?: { text: string; confidence: number };
    };

    const tags = (body.tagsResult?.values || [])
      .filter((t) => t.confidence > 0.7)
      .map((t) => t.name);

    const aiCaption = body.captionResult?.text || 'No caption generated';
    const confidence = body.captionResult?.confidence || 0;

    return { tags, aiCaption, confidence };
  } catch (error) {
    console.error('Vision analysis failed:', error);
    return { tags: ['unprocessed'], aiCaption: 'Image analysis unavailable', confidence: 0 };
  }
}
