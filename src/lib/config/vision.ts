// ─── Azure AI Vision Configuration ──────────────────────────────────────────

import createImageAnalysisClient, { ImageAnalysisClient } from '@azure-rest/ai-vision-image-analysis';
import { AzureKeyCredential } from '@azure/core-auth';
import { config } from './environment';

let visionClient: ImageAnalysisClient | null = null;

export function initializeVision(): boolean {
  if (visionClient) return true;

  if (!config.vision.endpoint || !config.vision.key) {
    console.warn('⚠️  AI Vision not configured — running in mock mode');
    return false;
  }

  visionClient = createImageAnalysisClient(
    config.vision.endpoint,
    new AzureKeyCredential(config.vision.key)
  );
  console.log('✅ Azure AI Vision ready');
  return true;
}

export function getVisionClient(): ImageAnalysisClient | null {
  return visionClient;
}
