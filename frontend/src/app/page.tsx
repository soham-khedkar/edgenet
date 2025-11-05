'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DeviceExplorer from '@/components/DeviceExplorer';
import TerminalPanel from '@/components/TerminalPanel';
import PhoneMockup from '@/components/PhoneMockup';
import BandwidthControl from '@/components/BandwidthControl';
import { useRealtimeDevices } from '@/hooks/useRealtimeData';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { DeviceGridSkeleton, StatsSkeleton } from '@/components/LoadingSkeleton';
import { Broadcast, Devices as DevicesIcon } from '@phosphor-icons/react';

export default function Home() {
  const { devices, loading, error, refetch, connected, source } = useRealtimeDevices();
  const { isConnected } = useConnectionStatus();
  const [agentHealthy, setAgentHealthy] = useState(true);
  const [configExists, setConfigExists] = useState(false);

  // Check if agent service is running and if config exists
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:5000/health', { 
          signal: AbortSignal.timeout(2000) 
        });
        setAgentHealthy(response.ok);
      } catch {
        setAgentHealthy(false);
      }
    };
    
    const checkConfig = async () => {
      try {
        const response = await fetch('http://localhost:5000/config-exists');
        const data = await response.json();
        setConfigExists(data.exists || false);
      } catch {
        setConfigExists(false);
      }
    };
    
    checkHealth();
    checkConfig();
    const healthInterval = setInterval(checkHealth, 30000);
    const configInterval = setInterval(checkConfig, 60000);
    return () => {
      clearInterval(healthInterval);
      clearInterval(configInterval);
    };
  }, []);

  // Fallback polling for compatibility (if realtime fails)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const activeDevices = devices.filter(d => d.signal_strength && d.signal_strength > 0).length;
  const band24GHz = devices.filter(d => d.band === '2.4 GHz').length;
  const band5GHz = devices.filter(d => d.band === '5 GHz').length;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 md:px-10 pb-10">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 grid-bg opacity-5 pointer-events-none"></div>
      
      {/* Hero Section */}
      <section className="mb-8">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-pixel mb-2">NETWORK_DASHBOARD</h1>
            <p className="text-xs font-mono text-gray-600">D-Link DIR-615 • Real-time monitoring</p>
          </div>
          <div className={`neo-card px-5 py-3 ${connected ? 'bg-[#FFD600]' : 'bg-gray-400'}`}>
            <div className="font-pixel text-[9px] mb-1">STATUS</div>
            <div className="font-mono text-base font-bold">{connected ? 'ONLINE' : 'OFFLINE'}</div>
            {source !== 'none' && (
              <div className="font-mono text-[8px] text-gray-700 mt-1">
                {source === 'backend' ? '📡 Cloud Data' : '🏠 Local Agent'}
              </div>
            )}
          </div>
        </div>
        
        {/* Separator */}
        <div className="h-6 grid-bg opacity-20"></div>
      </section>

      {/* Error Alert - Only show if not connected AND has error */}
      {error && !connected && (
        <div className="neo-card bg-red-100 border-red-500 p-5 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-pixel text-sm text-red-700 mb-2">
                CONNECTION_ERROR
              </div>
              <p className="font-mono text-sm text-red-600">{error}</p>
              {!agentHealthy && (
                <p className="font-mono text-xs text-red-500 mt-2">
                  Local agent is not running. Check if Docker container is up.
                </p>
              )}
              {agentHealthy && !configExists && (
                <p className="font-mono text-xs text-red-500 mt-2">
                  Router not configured. Go to <Link href="/setup" className="underline font-bold">Setup</Link> to configure.
                </p>
              )}
            </div>
            <button
              onClick={refetch}
              className="neo-button bg-red-500 text-white px-4 py-2 font-pixel text-xs whitespace-nowrap"
            >
              RETRY
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {loading ? (
          <>
            <StatsSkeleton />
            <StatsSkeleton />
            <StatsSkeleton />
          </>
        ) : (
          <>
            {/* Total Devices - Yellow */}
            <div className="neo-card bg-[#FFD600] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-pixel text-[9px] mb-2">DEVICES</div>
                  <div className="text-4xl font-bold">{devices.length}</div>
                  <div className="text-[10px] font-mono mt-1">TOTAL</div>
                </div>
                <DevicesIcon size={44} weight="bold" />
              </div>
            </div>

            {/* Active Devices - Cyan */}
            <div className="neo-card bg-[#00E5FF] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-pixel text-[9px] mb-2">ONLINE</div>
                  <div className="text-4xl font-bold">{activeDevices}</div>
                  <div className="text-[10px] font-mono mt-1">ACTIVE</div>
                </div>
                <div className="w-11 h-11 rounded-full bg-[#CCFF00] neo-border flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-black animate-pulse-neo"></div>
                </div>
              </div>
            </div>

            {/* Band Distribution - Pink */}
            <div className="neo-card bg-[#FF006E] p-5 text-white">
              <div className="font-pixel text-[9px] mb-2">BANDS</div>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-4xl font-bold">{band24GHz}</div>
                  <div className="text-[10px] font-mono">2.4 GHz</div>
                </div>
                <div className="text-2xl">+</div>
                <div>
                  <div className="text-4xl font-bold">{band5GHz}</div>
                  <div className="text-[10px] font-mono">5 GHz</div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Content Grid - Centered Phone Mockup, Devices Below */}
      <section className="space-y-8 mb-8">
        {devices.length === 0 && !loading ? (
          <div className="neo-card bg-white p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFD600] neo-border mx-auto mb-5 flex items-center justify-center">
              <DevicesIcon size={28} weight="bold" />
            </div>
            <h2 className="text-xl font-pixel mb-4">NO_DEVICES_FOUND</h2>
            <p className="text-gray-600 font-mono mb-5 text-xs">
              No router connection configured. Set up your router to start monitoring.
            </p>
            <Link 
              href="/setup"
              className="neo-button bg-[#FFD600] px-5 py-2.5 font-mono text-xs inline-block no-underline"
            >
              CONFIGURE_ROUTER
            </Link>
          </div>
        ) : (
          <>
            {/* Phone Mockup with Terminal - Centered */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-black"></div>
                <h2 className="font-pixel text-sm md:text-base">TERMINAL_VIEW</h2>
              </div>
              <div className="w-full max-w-[400px]">
                <PhoneMockup 
                  terminalContent={<TerminalPanel devices={devices} />}
                />
              </div>
            </div>

            {/* Separator with grid */}
            <div className="h-8 grid-bg opacity-20"></div>

            {/* Device Explorer - Full width below mockup */}
            <div className="w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-black"></div>
                <h2 className="font-pixel text-sm md:text-base">CONNECTED_DEVICES</h2>
              </div>
              <DeviceExplorer devices={devices} />
            </div>

            {/* Bandwidth Control Section */}
            <div className="w-full mt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-black"></div>
                <h2 className="font-pixel text-sm md:text-base">BANDWIDTH_CONTROL</h2>
              </div>
              <BandwidthControl />
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center">
        <div className="h-16 dot-bg opacity-10 neo-border mb-5"></div>
        <p className="text-[10px] text-gray-500 font-mono">
          EdgeNet - Universal Router Monitor
        </p>
      </footer>
    </main>
  );
}