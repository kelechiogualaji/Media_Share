// ─── Azure AI Content Safety Configuration ──────────────────────────────────

import ContentSafetyClient from '@azure-rest/ai-content-safety';
import { AzureKeyCredential } from '@azure/core-auth';
import { config } from './environment';
import type { Client } from '@azure-rest/core-client';

let safetyClient: Client | null = null;

export function initializeContentSafety(): boolean {
  if (safetyClient) return true;

  if (!config.contentSafety.endpoint || !config.contentSafety.key) {
    console.warn('⚠️  Content Safety not configured — running in mock mode');
    return false;
  }

  safetyClient = ContentSafetyClient(
    config.contentSafety.endpoint,
    new AzureKeyCredential(config.contentSafety.key)
  );
  console.log('✅ Azure AI Content Safety ready');
  return true;
}

export function getSafetyClient(): Client | null {
  return safetyClient;
}
