// ─── Helper Utilities ───────────────────────────────────────────────────────

import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import type { ApiResponse, PaginationMeta } from './types';

export function generateId(): string {
  return uuidv4();
}

export function now(): string {
  return new Date().toISOString();
}

export function sanitize(str: string): string {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

export function successResponse<T>(
  data: T,
  message = 'Success',
  extra: { pagination?: PaginationMeta; query?: string } = {}
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
    ...extra,
  });
}

export function errorResponse(
  message: string,
  statusCode = 500,
  details?: string[]
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, message, details } as ApiResponse,
    { status: statusCode }
  );
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
