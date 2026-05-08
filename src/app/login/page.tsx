'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/Toast';
import { Camera, Palette, Eye, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'consumer' | 'creator'>('consumer');
  const [loading, setLoading] = useState(false);
  const { login: setAuth } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true);
    const form = new FormData(e.currentTarget);
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = tab === 'login' ? { email: form.get('email'), password: form.get('password') } : { email: form.get('email'), password: form.get('password'), displayName: form.get('displayName'), role };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Request failed');
      setAuth(data.data.user, data.data.token);
      showToast(tab === 'login' ? 'Welcome back!' : 'Account created!', 'success');
      router.push(data.data.user.role === 'creator' ? '/upload' : '/feed');
    } catch (err) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-[fadeIn_0.3s_ease]">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-xl bg-[#3ecf8e]/20">
            <Camera className="w-6 h-6 text-[#3ecf8e]" />
          </div>
          <h1 className="text-xl font-bold text-[#ededed]">MediaShare</h1>
          <p className="text-xs text-[#555555] mt-1">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="px-6 pt-6">
            <div className="flex bg-[#252525] p-0.5 rounded-lg">
              <button className={`flex-1 h-9 rounded text-xs font-semibold transition-colors ${tab === 'login' ? 'bg-[#3ecf8e] text-[#1a1a1a]' : 'text-[#555555] hover:text-[#888888]'}`} onClick={() => setTab('login')}>Sign In</button>
              <button className={`flex-1 h-9 rounded text-xs font-semibold transition-colors ${tab === 'signup' ? 'bg-[#3ecf8e] text-[#1a1a1a]' : 'text-[#555555] hover:text-[#888888]'}`} onClick={() => setTab('signup')}>Sign Up</button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-6 pb-7">
            <div className="space-y-4">
              {tab === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-[#888888] mb-2">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className={`h-10 rounded-lg text-xs font-medium border transition-colors ${role === 'creator' ? 'border-[#3ecf8e] bg-[#3ecf8e]/10 text-[#3ecf8e]' : 'border-[#333333] text-[#888888] hover:bg-[#333333]'}`} onClick={() => setRole('creator')}>
                        <Palette className="w-4 h-4 mx-auto mb-1" />Creator
                      </button>
                      <button type="button" className={`h-10 rounded-lg text-xs font-medium border transition-colors ${role === 'consumer' ? 'border-[#3ecf8e] bg-[#3ecf8e]/10 text-[#3ecf8e]' : 'border-[#333333] text-[#888888] hover:bg-[#333333]'}`} onClick={() => setRole('consumer')}>
                        <Eye className="w-4 h-4 mx-auto mb-1" />Consumer
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#888888] mb-1.5" htmlFor="displayName">Name</label>
                    <input className="w-full h-10 px-3 bg-[#252525] border border-[#333333] rounded-lg text-[#ededed] text-xs outline-none focus:border-[#3ecf8e] transition-colors placeholder:text-[#555555]" name="displayName" id="displayName" type="text" placeholder="Your name" required />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[11px] font-medium text-[#888888] mb-1.5" htmlFor="email">Email</label>
                <input className="w-full h-10 px-3 bg-[#252525] border border-[#333333] rounded-lg text-[#ededed] text-xs outline-none focus:border-[#3ecf8e] transition-colors placeholder:text-[#555555]" name="email" id="email" type="email" placeholder="you@email.com" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#888888] mb-1.5" htmlFor="password">Password</label>
                <input className="w-full h-10 px-3 bg-[#252525] border border-[#333333] rounded-lg text-[#ededed] text-xs outline-none focus:border-[#3ecf8e] transition-colors placeholder:text-[#555555]" name="password" id="password" type="password" placeholder="••••••••" required minLength={6} />
              </div>
              <button type="submit" className="w-full h-10 mt-1 bg-[#3ecf8e] text-[#1a1a1a] rounded-lg font-semibold text-xs hover:bg-[#2db87a] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5" disabled={loading}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (tab === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
