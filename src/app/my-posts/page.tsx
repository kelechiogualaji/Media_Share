'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import PostCard from '@/components/PostCard';
import { showToast } from '@/components/Toast';
import type { Post, PaginationMeta } from '@/lib/types';
import { Upload, Image, Loader2 } from 'lucide-react';

export default function MyPostsPage() {
  const { isLoggedIn, user } = useAuth(); const api = useApi(); const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]); const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true); const [page, setPage] = useState(1);

  useEffect(() => { if (!isLoggedIn) router.push('/login'); else if (user?.role !== 'creator') router.push('/feed'); }, [isLoggedIn, user, router]);

  const loadPosts = useCallback(async (pageNum: number) => {
    setLoading(true); try { const res = await api.getMyPosts(pageNum); setPosts(res.data as Post[]); setPagination(res.pagination || null); }
    catch (err) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { if (isLoggedIn && user?.role === 'creator') loadPosts(1); }, [isLoggedIn, user]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!isLoggedIn || user?.role !== 'creator') return null;

  return (
    <div className="ml-60 p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-lg font-bold text-[#ededed]">My Posts</h1><p className="text-xs text-[#555555] mt-0.5">{pagination ? `${pagination.totalItems} posts` : 'Your content'}</p></div>
        <button onClick={() => router.push('/upload')} className="flex items-center gap-1.5 h-9 px-3 bg-[#3ecf8e] text-[#1a1a1a] rounded-md font-semibold text-xs hover:bg-[#2db87a] transition-colors"><Upload className="w-3.5 h-3.5" /> Upload</button>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-[#3ecf8e]" /></div>
      : posts.length === 0 ? <div className="text-center py-20"><Image className="w-10 h-10 mx-auto mb-3 text-[#555555]" /><p className="text-xs text-[#555555] mb-3">No posts</p><button onClick={() => router.push('/upload')} className="text-xs text-[#3ecf8e] underline underline-offset-2">Upload first</button></div>
      : (<>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-xs text-[#555555]">
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 border border-[#333333] rounded-md hover:bg-[#333333] disabled:opacity-30 transition-colors text-[#ededed]" disabled={!pagination.hasPrevPage} onClick={() => { setPage(page - 1); loadPosts(page - 1); }}>Prev</button>
              <button className="px-3 py-1.5 border border-[#333333] rounded-md hover:bg-[#333333] disabled:opacity-30 transition-colors text-[#ededed]" disabled={!pagination.hasNextPage} onClick={() => { setPage(page + 1); loadPosts(page + 1); }}>Next</button>
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}
