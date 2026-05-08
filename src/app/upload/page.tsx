'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { showToast } from '@/components/Toast';
import type { Post } from '@/lib/types';
import { Upload, Image, CheckCircle, AlertTriangle, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function UploadPage() {
  const { isLoggedIn, user } = useAuth(); const api = useApi(); const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState(''); const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false); const [result, setResult] = useState<Post | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { if (!isLoggedIn) router.push('/login'); else if (user?.role !== 'creator') { showToast('Creators only', 'error'); router.push('/feed'); } }, [isLoggedIn, user, router]);

  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) { showToast('Invalid file.', 'error'); return; }
    if (f.size > 10 * 1024 * 1024) { showToast('Max 10MB.', 'error'); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!file) { showToast('Select image', 'error'); return; } if (!caption.trim()) { showToast('Caption required', 'error'); return; }
    setUploading(true); try { const fd = new FormData(); fd.append('image', file); fd.append('caption', caption); if (location.trim()) fd.append('location', location);
    const res = await api.createPost(fd); setResult(res.data as Post); showToast('Created!', 'success'); } catch (err) { showToast((err as Error).message, 'error'); } finally { setUploading(false); }
  };

  const resetForm = () => { setFile(null); setPreview(null); setCaption(''); setLocation(''); setResult(null); };
  if (!isLoggedIn || user?.role !== 'creator') return null;

  return (
    <div className="ml-60 p-6 max-w-2xl">
      <h1 className="text-lg font-bold mb-1 flex items-center gap-2 text-[#ededed]"><Upload className="w-5 h-5 text-[#3ecf8e]" /> Upload</h1>
      <p className="text-xs text-[#555555] mb-6">Upload a new image for AI analysis</p>

      {result ? (
        <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-6 animate-[fadeIn_0.3s_ease]">
          <div className="flex items-center gap-2 mb-5"><CheckCircle className="w-5 h-5 text-[#3ecf8e]" /><span className="font-semibold text-sm text-[#ededed]">Post Created</span></div>
          <img className="max-h-64 rounded-md mb-5" src={result.imageUrl} alt={result.caption} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="bg-[#252525] border border-[#333333] rounded-md p-5 mb-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#3ecf8e] font-semibold text-sm"><Sparkles className="w-4 h-4" /> AI Analysis</div>
            <div><span className="text-[#555555]">Caption: </span><span className="text-[#888888]">{result.aiCaption}</span></div>
            <div className="flex flex-wrap gap-1">{result.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-[#3ecf8e]/10 text-[#3ecf8e] rounded text-[11px] font-medium">{t}</span>)}</div>
            <div className="flex items-center gap-1.5"><span className="text-[#555555]">Status:</span><span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${result.moderationStatus === 'safe' ? 'text-[#3ecf8e]' : 'text-[#f56565]'}`}><span className={`w-1.5 h-1.5 rounded-full ${result.moderationStatus === 'safe' ? 'bg-[#3ecf8e]' : 'bg-[#f56565]'}`} />{result.moderationStatus}</span></div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 h-9 bg-[#3ecf8e] text-[#1a1a1a] rounded-md font-semibold text-xs hover:bg-[#2db87a] transition-colors" onClick={resetForm}>Upload Another</button>
            <button className="flex-1 h-9 border border-[#333333] rounded-md text-xs font-medium text-[#ededed] hover:bg-[#333333] transition-colors flex items-center justify-center gap-1" onClick={() => router.push(`/post/${result.id}`)}>View <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={`border border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-48 flex flex-col items-center justify-center ${dragOver ? 'border-[#3ecf8e] bg-[#3ecf8e]/10' : preview ? 'border-[#333333] p-3' : 'border-[#333333] hover:border-[#3ecf8e]'}`}
            onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
            {preview ? <img className="max-h-64 rounded-md mx-auto" src={preview} alt="Preview" /> : (
              <><Image className="w-8 h-8 text-[#555555] mb-2" /><span className="text-xs text-[#888888]">Drop image or click</span><span className="text-[11px] text-[#555555] mt-1">Max 10MB</span></>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          {preview && (<div className="mt-5 space-y-4 animate-[fadeIn_0.2s_ease]">
            <div><label className="block text-[11px] font-medium text-[#888888] mb-1.5">Caption *</label>
              <textarea className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-[#ededed] text-xs outline-none focus:border-[#3ecf8e] transition-colors min-h-20 resize-y placeholder:text-[#555555]" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Describe..." maxLength={2000} required />
              <div className="text-[11px] text-[#555555] text-right">{caption.length}/2000</div>
            </div>
            <div><label className="block text-[11px] font-medium text-[#888888] mb-1.5">Location</label>
              <input className="w-full h-9 px-3 bg-[#252525] border border-[#333333] rounded-md text-[#ededed] text-xs outline-none focus:border-[#3ecf8e] transition-colors placeholder:text-[#555555]" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="London, UK" maxLength={200} />
            </div>
            <button type="submit" className="w-full h-9 bg-[#3ecf8e] text-[#1a1a1a] rounded-md font-semibold text-xs hover:bg-[#2db87a] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5" disabled={uploading}>
              {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5" /> Upload</>}
            </button>
          </div>)}
        </form>
      )}
    </div>
  );
}
