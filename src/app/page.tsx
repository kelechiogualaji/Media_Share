'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Camera } from 'lucide-react';

export default function LandingPage() {
  const { isLoggedIn, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center animate-[fadeIn_0.4s_ease]">
        <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-xl bg-[#3ecf8e]/20">
          <Camera className="w-7 h-7 text-[#3ecf8e]" />
        </div>
        <h1 className="text-3xl font-bold mb-4 tracking-tight text-[#ededed]">MediaShare Dashboard</h1>
        <p className="text-sm text-[#888888] mb-10 leading-relaxed">
          AI-powered media platform. Manage uploads, view analytics, and moderate content — all from one place.
        </p>
        <div className="flex gap-3 justify-center">
          {isLoggedIn && user ? (
            <Link href={user.role === 'creator' ? '/upload' : '/feed'} className="inline-flex items-center gap-2 h-10 px-6 bg-[#3ecf8e] text-[#1a1a1a] rounded-lg font-semibold text-sm no-underline hover:no-underline hover:bg-[#2db87a] transition-colors">
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-2 h-10 px-6 bg-[#3ecf8e] text-[#1a1a1a] rounded-lg font-semibold text-sm no-underline hover:no-underline hover:bg-[#2db87a] transition-colors">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
