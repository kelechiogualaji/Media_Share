// ─── Cosmos DB Configuration ────────────────────────────────────────────────
// Singleton client with lazy initialization. Falls back to in-memory mock
// when Azure credentials are not configured.
// ─────────────────────────────────────────────────────────────────────────────

import { CosmosClient, Container, Database } from '@azure/cosmos';
import { config } from './environment';
import { createMockContainers, getMockContainer, type MockContainer } from './mockDatabase';

let client: CosmosClient | null = null;
let database: Database | null = null;
const containers: Record<string, Container> = {};
let usingMock = false;

const containerDefinitions = [
  { id: 'users', partitionKey: '/id' },
  { id: 'posts', partitionKey: '/userId' },
  { id: 'comments', partitionKey: '/postId' },
  { id: 'ratings', partitionKey: '/postId' },
];

export async function initializeDatabase(): Promise<boolean> {
  if (Object.keys(containers).length > 0 || usingMock) return true;

  if (!config.cosmos.endpoint || !config.cosmos.key) {
    console.warn('⚠️  Cosmos DB credentials not configured — using in-memory mock database');
    createMockContainers();
    usingMock = true;
    return false;
  }

  try {
    client = new CosmosClient({
      endpoint: config.cosmos.endpoint,
      key: config.cosmos.key,
    });

    const { database: db } = await client.databases.createIfNotExists({
      id: config.cosmos.database,
    });
    database = db;

    for (const def of containerDefinitions) {
      const { container } = await database.containers.createIfNotExists({
        id: def.id,
        partitionKey: { paths: [def.partitionKey] },
      });
      containers[def.id] = container;
    }

    console.log(`✅ Cosmos DB "${config.cosmos.database}" initialized`);
    return true;
  } catch (error) {
    console.error('❌ Cosmos DB init failed, falling back to mock:', error);
    createMockContainers();
    usingMock = true;
    return false;
  }
}

/**
 * Get a database container. Returns either a real Cosmos Container
 * or a mock in-memory container with the same API shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getContainer(name: string): any {
  if (usingMock) {
    return getMockContainer(name);
  }
  if (!containers[name]) {
    throw new Error(`Container "${name}" not initialized. Ensure initializeDatabase() was called.`);
  }
  return containers[name];
}

export function isDbConnected(): boolean {
  return Object.keys(containers).length > 0 || usingMock;
}

export function isUsingMock(): boolean {
  return usingMock;
}
