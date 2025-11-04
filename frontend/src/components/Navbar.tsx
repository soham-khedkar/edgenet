'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, X, WifiHigh, Gear, ChartBar, Devices } from '@phosphor-icons/react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'DASHBOARD', icon: Devices, color: '#FFD600' },
    { href: '/statistics', label: 'STATISTICS', icon: ChartBar, color: '#00E5FF' },
    { href: '/setup', label: 'ROUTER_SETUP', icon: Gear, color: '#CCFF00' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b-4 border-[#FFD600]">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline group">
            <div className="w-8 h-8 bg-[#FFD600] neo-border flex items-center justify-center group-hover:bg-[#00E5FF] transition-colors">
              <WifiHigh size={20} color="#000" weight="bold" />
            </div>
            <span className="text-white font-pixel text-xs md:text-sm">
              EDGENET
            </span>
          </Link>

          {/* Center: Status */}
          <div className="hidden md:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse-neo"></div>
            <span className="text-[#CCFF00] text-[10px] font-mono">CONNECTED</span>
          </div>

          {/* Right: Hamburger Menu */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="neo-button bg-[#00E5FF] p-2"
            aria-label="Menu"
          >
            {menuOpen ? (
              <X size={20} color="#000" weight="bold" />
            ) : (
              <List size={20} color="#000" weight="bold" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Dropdown */}
      {menuOpen && (
        <div className="bg-black border-t-4 border-[#FFD600]">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12 py-4 flex flex-col gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`neo-button flex items-center gap-3 px-4 py-3 font-pixel text-xs md:text-sm no-underline ${
                    active ? 'bg-white' : 'bg-transparent'
                  }`}
                  style={{
                    borderColor: link.color,
                    color: active ? '#000' : '#fff'
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={20} weight="bold" color={active ? '#000' : link.color} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
