'use client';

import { useState } from 'react';
import { Folder, Terminal as TerminalIcon } from '@phosphor-icons/react';

interface PhoneMockupProps {
  terminalContent?: React.ReactNode;
  explorerContent?: React.ReactNode;
}

export default function PhoneMockup({ terminalContent, explorerContent }: PhoneMockupProps) {
  const [activeTab, setActiveTab] = useState<'explorer' | 'terminal'>('terminal');

  return (
    <div className="relative neo-border bg-[#1a1a1a] rounded-[2rem] p-4 w-full max-w-[400px] mx-auto">
      {/* Screen */}
      <div className="bg-[#0A0E1A] rounded-[1.5rem] overflow-hidden neo-border-thin">
        {/* Status Bar */}
        <div className="bg-black px-4 py-2.5 flex items-center justify-between border-b-2 border-[#FFD600]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#CCFF00]"></div>
            <span className="text-[10px] text-white font-pixel">EdgeNet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-neo"></div>
            <span className="text-[9px] text-green-500 font-mono">Connected</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="bg-[#1a1a1a] flex border-b-2 border-[#FFD600]">
          <button 
            onClick={() => setActiveTab('explorer')}
            className={`flex-1 px-4 py-3 border-r-2 border-[#FFD600] transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'explorer' ? 'bg-[#FFD600] text-black' : 'bg-transparent text-white'
            }`}
          >
            <Folder size={16} weight="bold" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Explorer</span>
          </button>
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`flex-1 px-4 py-3 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'terminal' ? 'bg-[#00E5FF] text-black' : 'bg-transparent text-white'
            }`}
          >
            <TerminalIcon size={16} weight="bold" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Terminal</span>
          </button>
        </div>

        {/* Content */}
        <div className="h-[500px] overflow-auto">
          {activeTab === 'terminal' ? (
            terminalContent || <DefaultTerminal />
          ) : (
            explorerContent || <DefaultExplorer />
          )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-black px-4 py-2.5 border-t-2 border-[#FFD600]">
          <div className="text-[9px] text-gray-500 text-center font-mono">
            EdgeNet v1.0.0 - Universal Router Monitor
          </div>
        </div>
      </div>

      {/* Phone Buttons (Decorative) */}
      <div className="absolute -right-2 top-24 w-1 h-8 bg-[#FFD600] neo-border-thin rounded-r"></div>
      <div className="absolute -right-2 top-36 w-1 h-12 bg-[#FFD600] neo-border-thin rounded-r"></div>
    </div>
  );
}

// Default Terminal Content
function DefaultTerminal() {
  return (
    <div className="bg-[#0A0E1A] p-4 h-full font-mono text-sm">
      <div className="space-y-1">
        <div className="text-[#CCFF00]">EdgeNet Terminal v1.0.0</div>
        <div className="text-gray-500 text-xs">Type &quot;help&quot; for commands</div>
        <div className="text-white mt-4">$ status</div>
        <div className="text-[#00E5FF] text-xs">System: Online</div>
        <div className="text-[#00E5FF] text-xs">Router: Connected</div>
        <div className="text-[#00E5FF] text-xs">Devices: Active</div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[#FFD600]">$</span>
          <span className="text-white opacity-50 text-xs">Ready for commands...</span>
        </div>
      </div>
    </div>
  );
}

// Default Explorer Content
function DefaultExplorer() {
  const folders = [
    { name: '2.4 GHz Network', count: 8, color: '#FFD600' },
    { name: '5 GHz Network', count: 12, color: '#00E5FF' },
    { name: 'Ethernet Devices', count: 3, color: '#CCFF00' },
    { name: 'Blocked Devices', count: 2, color: '#FF006E' }
  ];

  return (
    <div className="bg-[#0A0E1A] p-4 h-full">
      <div className="space-y-2">
        {folders.map((folder, idx) => (
          <div 
            key={idx}
            className="neo-border-thin bg-[#1a1a1a] p-3 hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder size={20} weight="bold" style={{ color: folder.color }} />
                <span className="text-white text-xs font-mono">{folder.name}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: folder.color }}>
                {folder.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
