// ─── Content Moderation Service ─────────────────────────────────────────────

import { getSafetyClient } from '../config/contentSafety';
import { config } from '../config/environment';
import type { ModerationResult } from '../types';

export async function moderateImage(imageBuffer: Buffer): Promise<ModerationResult> {
  const client = getSafetyClient();

  if (!client) {
    return {
      isSafe: true,
      moderationStatus: 'safe',
      categories: { Hate: 0, SelfHarm: 0, Sexual: 0, Violence: 0 },
      flaggedCategories: [],
    };
  }

  try {
    const base64Content = imageBuffer.toString('base64');

    const result = await client.path('/image:analyze').post({
      body: {
        image: { content: base64Content },
      },
      contentType: 'application/json',
    });

    if (result.status !== '200') {
      console.error('Content Safety API error:', result.body);
      throw new Error(`Content Safety returned status ${result.status}`);
    }

    const body = result.body as {
      categoriesAnalysis?: Array<{
        category: string;
        severity: number;
      }>;
    };

    const categories: Record<string, number> = {};
    const flaggedCategories: string[] = [];

    for (const cat of body.categoriesAnalysis || []) {
      categories[cat.category] = cat.severity ?? 0;
      if ((cat.severity ?? 0) >= config.contentSafety.severityThreshold) {
        flaggedCategories.push(cat.category);
      }
    }

    const isSafe = flaggedCategories.length === 0;

    console.log(`🔍 Moderation: ${isSafe ? '✅ SAFE' : '🚫 FLAGGED'} (${flaggedCategories.join(', ') || 'clean'})`);

    return {
      isSafe,
      moderationStatus: isSafe ? 'safe' : 'flagged',
      categories,
      flaggedCategories,
    };
  } catch (error) {
    console.error('Content moderation failed:', error);
    return { isSafe: true, moderationStatus: 'safe', categories: {}, flaggedCategories: [] };
  }
}
