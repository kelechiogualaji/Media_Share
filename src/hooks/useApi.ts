'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { ApiResponse } from '@/lib/types';

export function useApi() {
  const { token, logout } = useAuth();

  const request = useCallback(async <T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const response = await fetch(`/api${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) logout();
      throw new Error(data.message || 'Request failed');
    }

    return data as ApiResponse<T>;
  }, [token, logout]);

  return {
    signup: (body: object) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: object) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    createPost: (formData: FormData) => request('/posts', { method: 'POST', body: formData }),
    getFeed: (page = 1, limit = 12) => request(`/posts?page=${page}&limit=${limit}`),
    searchPosts: (q: string, page = 1) => request(`/posts/search?q=${encodeURIComponent(q)}&page=${page}`),
    getPost: (id: string) => request(`/posts/${id}`),
    getMyPosts: (page = 1) => request(`/posts/user/me?page=${page}`),
    addComment: (postId: string, text: string) => request('/comments', { method: 'POST', body: JSON.stringify({ postId, text }) }),
    getComments: (postId: string, page = 1) => request(`/comments/${postId}?page=${page}`),
    addRating: (postId: string, score: number) => request('/ratings', { method: 'POST', body: JSON.stringify({ postId, score }) }),
    getRatings: (postId: string) => request(`/ratings/${postId}`),
  };
}
