'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import PostCard from '@/components/PostCard';
import { showToast } from '@/components/Toast';
import type { Post, PaginationMeta } from '@/lib/types';
import { Search, X, Image, Loader2, LayoutGrid, List } from 'lucide-react';

export default function FeedPage() {
  const { isLoggedIn } = useAuth(); const api = useApi(); const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]); const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true); const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false); const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => { if (!isLoggedIn) router.push('/login'); }, [isLoggedIn, router]);

  const loadFeed = useCallback(async (pageNum: number) => {
    setLoading(true); try { const res = await api.getFeed(pageNum); setPosts(res.data as Post[]); setPagination(res.pagination || null); setIsSearching(false); }
    catch (err) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  }, [api]);

  const handleSearch = useCallback(async (pageNum: number = 1) => {
    if (!searchQuery.trim()) { loadFeed(1); return; } setLoading(true);
    try { const res = await api.searchPosts(searchQuery.trim(), pageNum); setPosts(res.data as Post[]); setPagination(res.pagination || null); setIsSearching(true); }
    catch (err) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  }, [api, searchQuery, loadFeed]);

  useEffect(() => { if (isLoggedIn) loadFeed(1); }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps
  const handlePageChange = (newPage: number) => { setPage(newPage); isSearching ? handleSearch(newPage) : loadFeed(newPage); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  if (!isLoggedIn) return null;

  return (
    <div className="ml-60 p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-lg font-bold text-[#ededed]">{isSearching ? `Search: "${searchQuery}"` : 'Feed'}</h1><p className="text-xs text-[#555555] mt-0.5">{pagination ? `${pagination.totalItems} total posts` : 'Browse all content'}</p></div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#333333] rounded-md overflow-hidden">
            <button className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-[#3ecf8e] text-[#1a1a1a]' : 'text-[#555555] hover:bg-[#333333]'}`} onClick={() => setViewMode('grid')}><LayoutGrid className="w-3.5 h-3.5" /></button>
            <button className={`p-1.5 transition-colors ${viewMode === 'table' ? 'bg-[#3ecf8e] text-[#1a1a1a]' : 'text-[#555555] hover:bg-[#333333]'}`} onClick={() => setViewMode('table')}><List className="w-3.5 h-3.5" /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); handleSearch(1); }} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555555]" />
            <input className="w-56 h-9 pl-8 pr-7 bg-[#252525] border border-[#333333] rounded-md text-[#ededed] text-xs outline-none focus:border-[#3ecf8e] transition-colors placeholder:text-[#555555]" type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {isSearching && <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#ededed]" onClick={() => { setSearchQuery(''); setPage(1); loadFeed(1); }}><X className="w-3 h-3" /></button>}
          </form>
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-[#3ecf8e]" /></div>
      : posts.length === 0 ? <div className="text-center py-20"><Image className="w-10 h-10 mx-auto mb-3 text-[#555555]" /><p className="text-xs text-[#555555]">{isSearching ? 'No results.' : 'No posts.'}</p></div>
      : viewMode === 'grid' ? <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
      : (
        <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-[#333333] bg-[#252525]"><th className="text-left px-3 py-2 font-semibold text-[#888888]">Caption</th><th className="text-left px-3 py-2 font-semibold text-[#888888]">Author</th><th className="text-left px-3 py-2 font-semibold text-[#888888]">Status</th><th className="text-left px-3 py-2 font-semibold text-[#888888]">Rating</th><th className="text-left px-3 py-2 font-semibold text-[#888888]">Comments</th></tr></thead>
            <tbody>{posts.map((post) => (
              <tr key={post.id} className="border-b border-[#333333] last:border-b-0 hover:bg-[#333333] cursor-pointer transition-colors" onClick={() => router.push(`/post/${post.id}`)}>
                <td className="px-3 py-2.5 max-w-xs truncate text-[#ededed]">{post.caption}</td>
                <td className="px-3 py-2.5 text-[#888888]">{post.userName}</td>
                <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1 ${post.moderationStatus === 'safe' ? 'text-[#3ecf8e]' : 'text-[#f56565]'}`}><span className={`w-1.5 h-1.5 rounded-full ${post.moderationStatus === 'safe' ? 'bg-[#3ecf8e]' : 'bg-[#f56565]'}`} />{post.moderationStatus}</span></td>
                <td className="px-3 py-2.5 text-[#888888]">{post.averageRating || '—'}</td>
                <td className="px-3 py-2.5 text-[#888888]">{post.commentCount || 0}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-xs text-[#555555]">
          <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-[#333333] rounded-md hover:bg-[#333333] disabled:opacity-30 transition-colors text-[#ededed]" disabled={!pagination.hasPrevPage} onClick={() => handlePageChange(page - 1)}>Previous</button>
            <button className="px-3 py-1.5 border border-[#333333] rounded-md hover:bg-[#333333] disabled:opacity-30 transition-colors text-[#ededed]" disabled={!pagination.hasNextPage} onClick={() => handlePageChange(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
