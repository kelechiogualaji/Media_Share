'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Camera, LayoutDashboard, Upload, Images, LogOut } from 'lucide-react';

const creatorLinks = [
  { href: '/feed', label: 'Feed', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/my-posts', label: 'My Posts', icon: Images },
];

const consumerLinks = [
  { href: '/feed', label: 'Feed', icon: LayoutDashboard },
];

export default function Sidebar() {
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isLoggedIn) return null;

  const links = user?.role === 'creator' ? creatorLinks : consumerLinks;

  return (
    <aside className="fixed top-0 left-0 w-60 h-screen bg-[#1a1a1a] border-r border-[#333333] flex flex-col z-50">
      <div className="px-5 h-14 flex items-center gap-2 border-b border-[#333333]">
        <Camera className="w-5 h-5 text-[#3ecf8e]" />
        <span className="font-semibold text-sm text-[#ededed]">MediaShare</span>
      </div>

      <nav className="flex-1 py-3 px-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#555555] px-2 mb-2">Navigation</div>
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm no-underline transition-colors mb-0.5 ${pathname === link.href ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] font-medium' : 'text-[#888888] hover:bg-[#333333] hover:text-[#ededed]'}`}>
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-[#333333]">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-md bg-[#3ecf8e] text-[#1a1a1a] flex items-center justify-center font-bold text-xs">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#ededed] truncate">{user?.displayName}</div>
            <div className="text-[10px] text-[#555555] uppercase">{user?.role}</div>
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/'); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#555555] hover:text-[#ededed] hover:bg-[#333333] rounded-md transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
