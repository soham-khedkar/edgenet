'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, X, WifiHigh, Gear, ChartBar, Devices, SignOut, User } from '@phosphor-icons/react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isConnected } = useConnectionStatus();
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'DASHBOARD', icon: Devices, color: '#FFD600' },
    { href: '/statistics', label: 'STATISTICS', icon: ChartBar, color: '#00E5FF' },
    { href: '/setup', label: 'ROUTER_SETUP', icon: Gear, color: '#CCFF00' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b-4 border-[#FFD600]">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 no-underline group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FFD600] neo-border flex items-center justify-center group-hover:bg-[#00E5FF] transition-colors">
              <WifiHigh size={16} color="#000" weight="bold" className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-white font-pixel text-[10px] sm:text-xs md:text-sm">
              EDGENET
            </span>
          </Link>

          {/* Center: Status */}
          <div className="hidden md:flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#CCFF00] animate-pulse-neo' : 'bg-red-500'}`}></div>
              <span className={`text-[9px] sm:text-[10px] font-mono ${isConnected ? 'text-[#CCFF00]' : 'text-red-500'}`}>
                {isConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
            {user && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-mono text-white max-w-[150px] lg:max-w-none">
                <User size={12} weight="bold" className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user && (
              <button
                onClick={() => signOut()}
                className="hidden md:block neo-button bg-red-500 text-white px-2.5 sm:px-3 py-1.5 font-pixel text-[9px] sm:text-[10px]"
                title="Logout"
              >
                <SignOut size={12} weight="bold" className="sm:w-[14px] sm:h-[14px]" />
              </button>
            )}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="neo-button bg-[#00E5FF] p-1.5 sm:p-2"
              aria-label="Menu"
            >
              {menuOpen ? (
                <X size={18} color="#000" weight="bold" className="sm:w-5 sm:h-5" />
              ) : (
                <List size={18} color="#000" weight="bold" className="sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown */}
      {menuOpen && (
        <div className="bg-black border-t-4 border-[#FFD600]">
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-8 lg:px-12 py-3 sm:py-4 flex flex-col gap-2.5 sm:gap-3">
            {/* User Info (Mobile) */}
            {user && (
              <div className="md:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 neo-border border-white/20 gap-2 sm:gap-0">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-mono text-white w-full sm:w-auto">
                  <User size={12} weight="bold" className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="neo-button bg-red-500 text-white px-2.5 sm:px-3 py-1.5 font-pixel text-[9px] sm:text-[10px] w-full sm:w-auto"
                >
                  LOGOUT
                </button>
              </div>
            )}

            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`neo-button flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 font-pixel text-[10px] sm:text-xs md:text-sm no-underline ${
                    active ? 'bg-white' : 'bg-transparent'
                  }`}
                  style={{
                    borderColor: link.color,
                    color: active ? '#000' : '#fff'
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={18} weight="bold" color={active ? '#000' : link.color} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}

            {!user && (
              <Link
                href="/login"
                className="neo-button flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 font-pixel text-[10px] sm:text-xs md:text-sm no-underline bg-[#FFD600]"
                onClick={() => setMenuOpen(false)}
              >
                <User size={18} weight="bold" className="sm:w-5 sm:h-5" />
                LOGIN
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
