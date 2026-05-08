// ─── Environment Configuration ──────────────────────────────────────────────
// Provides typed access to all environment variables with validation.
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h',

  // Azure Cosmos DB
  cosmos: {
    endpoint: process.env.COSMOS_ENDPOINT || '',
    key: process.env.COSMOS_KEY || '',
    database: process.env.COSMOS_DATABASE || 'mediashare',
  },

  // Azure Blob Storage
  storage: {
    connectionString: process.env.STORAGE_CONNECTION_STRING || '',
    containerName: process.env.STORAGE_CONTAINER_NAME || 'media',
  },

  // Azure AI Vision
  vision: {
    endpoint: process.env.VISION_ENDPOINT || '',
    key: process.env.VISION_KEY || '',
  },

  // Azure AI Content Safety
  contentSafety: {
    endpoint: process.env.CONTENT_SAFETY_ENDPOINT || '',
    key: process.env.CONTENT_SAFETY_KEY || '',
    severityThreshold: parseInt(process.env.MODERATION_THRESHOLD || '4', 10),
  },

  // Upload limits
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
} as const;

export type Config = typeof config;
