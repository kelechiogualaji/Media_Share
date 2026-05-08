// ─── JWT Auth Middleware for API Routes ──────────────────────────────────────

import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { errorResponse } from '../helpers';
import type { AuthPayload } from '../types';
import type { NextRequest } from 'next/server';

/**
 * Verify JWT from a Next.js request and return the decoded payload.
 * Returns null and a NextResponse error if authentication fails.
 */
export function verifyAuth(request: NextRequest): { user: AuthPayload | null; error: ReturnType<typeof errorResponse> | null } {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: errorResponse('Authentication required', 401) };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
    return {
      user: {
        userId: decoded.userId,
        email: decoded.email,
        displayName: decoded.displayName,
        role: decoded.role,
      },
      error: null,
    };
  } catch (err) {
    const message = (err as Error).name === 'TokenExpiredError'
      ? 'Token expired. Please log in again.'
      : 'Invalid token.';
    return { user: null, error: errorResponse(message, 401) };
  }
}

/**
 * Check that the user has one of the allowed roles.
 */
export function checkRole(user: AuthPayload, ...roles: string[]) {
  if (!roles.includes(user.role)) {
    return errorResponse(
      `Access denied. Required role: ${roles.join(' or ')}`,
      403
    );
  }
  return null;
}
