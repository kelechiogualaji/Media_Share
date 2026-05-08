'use client';

import type { Post } from '@/lib/types';
import Link from 'next/link';
import { Star, MessageSquare, MapPin, User, CheckCircle, AlertTriangle } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime(); const mins = Math.floor(diff / 60000); const hrs = Math.floor(diff / 3600000); const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now'; if (mins < 60) return `${mins}m ago`; if (hrs < 24) return `${hrs}h ago`; if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostCard({ post }: { post: Post }) {
  const filledStars = Math.round(post.averageRating || 0);

  return (
    <Link href={`/post/${post.id}`} className="block bg-[#2a2a2a] border border-[#333333] rounded-lg overflow-hidden no-underline text-inherit hover:no-underline hover:border-[#444444] hover:bg-[#333333] transition-colors group">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#252525]">
        <img className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" src={post.imageUrl} alt={post.caption} loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23252525' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23555'%3ENo image%3C/text%3E%3C/svg%3E"; }}
        />
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${post.moderationStatus === 'safe' ? 'bg-[#3ecf8e]/20 text-[#3ecf8e]' : 'bg-[#f56565]/20 text-[#f56565]'}`}>
            {post.moderationStatus === 'safe' ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
            {post.moderationStatus === 'safe' ? 'Safe' : 'Flag'}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-[#ededed] line-clamp-1 font-medium">{post.caption}</p>
        <div className="flex items-center justify-between text-[11px] text-[#555555]">
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.userName}</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3 h-3 ${i < filledStars ? 'text-[#3ecf8e] fill-[#3ecf8e]' : 'text-[#444444]'}`} />)}</div>
          <span className="flex items-center gap-1 text-[11px] text-[#555555]"><MessageSquare className="w-3 h-3" />{post.commentCount || 0}</span>
        </div>
        {post.location && <div className="flex items-center gap-1 text-[11px] text-[#555555]"><MapPin className="w-3 h-3" />{post.location}</div>}
      </div>
    </Link>
  );
}
