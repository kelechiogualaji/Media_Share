'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import StarRating from '@/components/StarRating';
import { showToast } from '@/components/Toast';
import type { Post, Comment } from '@/lib/types';
import { ArrowLeft, CheckCircle, AlertTriangle, Sparkles, Star, MessageSquare, MapPin, Send, Loader2 } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime(); const mins = Math.floor(diff / 60000); const hrs = Math.floor(diff / 3600000); const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now'; if (mins < 60) return `${mins}m ago`; if (hrs < 24) return `${hrs}h ago`; if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { isLoggedIn, user } = useAuth(); const api = useApi(); const router = useRouter();
  const [post, setPost] = useState<Post | null>(null); const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState(''); const [userRating, setUserRating] = useState(0);
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalRatings: 0 });
  const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!isLoggedIn) router.push('/login'); }, [isLoggedIn, router]);

  const loadPost = useCallback(async () => {
    try { const [pRes, cRes, rRes] = await Promise.all([api.getPost(id), api.getComments(id), api.getRatings(id)]);
    setPost(pRes.data as Post); setComments((cRes.data || []) as Comment[]);
    const rd = rRes.data as { stats: { averageRating: number; totalRatings: number } }; setRatingStats(rd.stats);
    } catch (err) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  }, [api, id]);

  useEffect(() => { if (isLoggedIn) loadPost(); }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComment = async (e: React.FormEvent) => { e.preventDefault(); if (!commentText.trim()) return; setSubmitting(true);
    try { const res = await api.addComment(id, commentText.trim()); setComments((prev) => [res.data as Comment, ...prev]); setCommentText(''); showToast('Added', 'success'); }
    catch (err) { showToast((err as Error).message, 'error'); } finally { setSubmitting(false); } };

  const handleRate = async (score: number) => { setUserRating(score);
    try { await api.addRating(id, score); showToast(`Rated ${score}/5`, 'success'); const rr = await api.getRatings(id);
    const rd = rr.data as { stats: { averageRating: number; totalRatings: number } }; setRatingStats(rd.stats); }
    catch (err) { showToast((err as Error).message, 'error'); } };

  if (!isLoggedIn) return null;
  if (loading) return <div className="ml-60 flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-[#3ecf8e]" /></div>;
  if (!post) return <div className="ml-60 text-center py-24"><p className="text-xs text-[#555555] mb-2">Not found</p><button onClick={() => router.push('/feed')} className="text-xs text-[#3ecf8e] underline">Back</button></div>;

  return (
    <div className="ml-60 p-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-[#555555] hover:text-[#ededed] transition-colors mb-5"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <img className="w-full rounded-lg mb-5" src={post.imageUrl} alt={post.caption} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#3ecf8e] text-[#1a1a1a] flex items-center justify-center font-bold text-xs">{post.userName.charAt(0).toUpperCase()}</div>
                <div><span className="text-xs font-medium text-[#ededed]">{post.userName}</span><span className="text-[11px] text-[#555555] ml-2">{timeAgo(post.createdAt)}</span></div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${post.moderationStatus === 'safe' ? 'text-[#3ecf8e]' : 'text-[#f56565]'}`}><span className={`w-1.5 h-1.5 rounded-full ${post.moderationStatus === 'safe' ? 'bg-[#3ecf8e]' : 'bg-[#f56565]'}`} />{post.moderationStatus}</span>
            </div>
            <p className="text-xs leading-relaxed text-[#ededed] mb-1">{post.caption}</p>
            {post.location && <p className="flex items-center gap-1 text-[11px] text-[#555555]"><MapPin className="w-3 h-3" />{post.location}</p>}
          </div>

          <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-5">
            <h3 className="text-xs font-semibold mb-4 flex items-center gap-1.5 text-[#ededed]"><MessageSquare className="w-3.5 h-3.5 text-[#3ecf8e]" /> Comments ({comments.length})</h3>
            {user?.role === 'consumer' && (
              <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input className="flex-1 h-9 px-3 bg-[#252525] border border-[#333333] rounded-md text-[#ededed] text-xs outline-none focus:border-[#3ecf8e] transition-colors placeholder:text-[#555555]" type="text" placeholder="Comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={1000} />
                <button type="submit" className="h-9 px-3 bg-[#3ecf8e] text-[#1a1a1a] rounded-md text-xs font-semibold hover:bg-[#2db87a] disabled:opacity-50 transition-colors" disabled={submitting || !commentText.trim()}>
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </button>
              </form>
            )}
            {comments.length === 0 ? <p className="text-[11px] text-[#555555] italic">No comments.</p> : (
              <div className="space-y-2">{comments.map((c) => (
                <div key={c.id} className="p-2.5 bg-[#252525] rounded-md"><div className="flex items-center gap-1.5 mb-0.5"><span className="text-xs font-medium text-[#ededed]">{c.userName}</span><span className="text-[10px] text-[#555555]">{timeAgo(c.createdAt)}</span></div><p className="text-xs text-[#888888]">{c.text}</p></div>
              ))}</div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-5">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-[#ededed]"><Sparkles className="w-3.5 h-3.5 text-[#3ecf8e]" /> AI Analysis</h3>
            <p className="text-xs text-[#888888] italic mb-2">{post.aiCaption}</p>
            <div className="flex flex-wrap gap-1">{post.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-[#3ecf8e]/10 text-[#3ecf8e] rounded text-[11px] font-medium">{t}</span>)}</div>
          </div>
          <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-5">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-[#ededed]"><Star className="w-3.5 h-3.5 text-[#3ecf8e]" /> Rating</h3>
            <div className="flex items-center gap-2 mb-2"><span className="text-xl font-bold text-[#3ecf8e]">{ratingStats.averageRating}</span><StarRating value={Math.round(ratingStats.averageRating)} readonly size="sm" /><span className="text-[11px] text-[#555555]">({ratingStats.totalRatings})</span></div>
            {user?.role === 'consumer' && <div className="pt-2 border-t border-[#333333]"><span className="text-xs text-[#555555] block mb-1">Your rating:</span><StarRating value={userRating} onChange={handleRate} size="sm" /></div>}
          </div>
          <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-5">
            <h3 className="text-xs font-semibold mb-2 text-[#ededed]">Details</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-[#555555]">ID</span><span className="font-mono text-[#888888] truncate ml-2 max-w-[140px]">{post.id}</span></div>
              <div className="flex justify-between"><span className="text-[#555555]">Created</span><span className="text-[#888888]">{new Date(post.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-[#555555]">Tags</span><span className="text-[#888888]">{post.tags.length}</span></div>
              <div className="flex justify-between"><span className="text-[#555555]">Comments</span><span className="text-[#888888]">{comments.length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
