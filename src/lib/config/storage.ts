// ─── Azure Blob Storage Configuration ───────────────────────────────────────

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config } from './environment';

let containerClient: ContainerClient | null = null;

export async function initializeStorage(): Promise<boolean> {
  if (containerClient) return true;

  if (!config.storage.connectionString) {
    console.warn('⚠️  Blob Storage not configured — running in mock mode');
    return false;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.storage.connectionString
    );
    containerClient = blobServiceClient.getContainerClient(config.storage.containerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    console.log(`✅ Blob Storage "${config.storage.containerName}" ready`);
    return true;
  } catch (error) {
    console.error('❌ Blob Storage init failed:', error);
    throw error;
  }
}

export function getContainerClient(): ContainerClient {
  if (!containerClient) {
    throw new Error('Blob Storage not initialized.');
  }
  return containerClient;
}

export function isStorageConnected(): boolean {
  return containerClient !== null;
}
