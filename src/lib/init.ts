// ─── Database Initializer ───────────────────────────────────────────────────
// Ensures all Azure services are initialized before API requests.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeDatabase, isDbConnected } from './config/database';
import { initializeStorage, isStorageConnected } from './config/storage';
import { initializeVision } from './config/vision';
import { initializeContentSafety } from './config/contentSafety';

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  try { await initializeDatabase(); } catch (e) { console.error('DB init failed:', e); }
  try { await initializeStorage(); } catch (e) { console.error('Storage init failed:', e); }
  try { initializeVision(); } catch (e) { console.error('Vision init failed:', e); }
  try { initializeContentSafety(); } catch (e) { console.error('Safety init failed:', e); }

  initialized = true;
  console.log('✅ All services initialized');
}

export function getServiceStatus() {
  return {
    database: isDbConnected(),
    storage: isStorageConnected(),
  };
}
