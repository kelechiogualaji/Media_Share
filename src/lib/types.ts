// ─── TypeScript Type Definitions ────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'creator' | 'consumer';
  profileImageUrl: string | null;
  createdAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface Post {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  caption: string;
  aiCaption: string;
  tags: string[];
  location: string;
  moderationStatus: 'safe' | 'flagged';
  moderationDetails: {
    categories: Record<string, number>;
    flaggedCategories: string[];
  };
  commentCount: number;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  postId: string;
  userId: string;
  score: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  displayName: string;
  role: 'creator' | 'consumer';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  query?: string;
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface VisionResult {
  tags: string[];
  aiCaption: string;
  confidence: number;
}

export interface ModerationResult {
  isSafe: boolean;
  moderationStatus: 'safe' | 'flagged';
  categories: Record<string, number>;
  flaggedCategories: string[];
}
