'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gear, CheckCircle, XCircle, MagnifyingGlass } from '@phosphor-icons/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RouterConfig {
  routerIp: string;
  username: string;
  password: string;
  pollingInterval: number;
}

export default function SetupPage() {
  const [config, setConfig] = useState<RouterConfig>({
    routerIp: '192.168.0.1',
    username: 'admin',
    password: '',
    pollingInterval: 30
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleInputChange = (field: keyof RouterConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
    setSaved(false);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/setup/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      setTestResult({ 
        success: data.success || false, 
        message: data.message || (data.success ? 'Connection successful!' : 'Connection failed')
      });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Unable to connect to backend service.' 
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/setup/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      if (response.ok) {
        setSaved(true);
      } else {
        alert('Failed to save: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Unable to save configuration. Check your connection.');
    }
  };

  const isFormValid = config.routerIp && config.username && config.password;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 md:px-10 pb-10">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 grid-bg opacity-5 pointer-events-none"></div>
      
      {/* Header */}
      <section className="mb-8">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-pixel mb-2">ROUTER_SETUP</h1>
            <p className="text-sm md:text-base font-mono text-gray-600">Configure network monitoring agent</p>
          </div>
          <div className="neo-card bg-[#FF006E] text-white px-5 py-4">
            <Gear size={36} weight="bold" />
          </div>
        </div>
        
        {/* Separator */}
        <div className="h-6 grid-bg opacity-20"></div>
      </section>

      <div className="max-w-3xl mx-auto relative">
        {/* Dot pattern decoration */}
        <div className="absolute -right-20 top-20 w-48 h-48 dot-bg opacity-5 pointer-events-none"></div>

        {/* Setup Form */}
        <div className="neo-card bg-white p-6 md:p-8 mb-8 relative z-10">
          <div className="space-y-6">
            {/* Router IP */}
            <div>
              <label className="block font-pixel text-xs md:text-sm mb-3">ROUTER_IP_ADDRESS</label>
              <input
                type="text"
                value={config.routerIp}
                onChange={(e) => handleInputChange('routerIp', e.target.value)}
                placeholder="192.168.0.1"
                className="w-full neo-border p-4 font-mono text-base focus:outline-none focus:ring-4 focus:ring-[#FFD600] bg-white"
              />
              <p className="text-xs md:text-sm font-mono text-gray-600 mt-2">
                Usually 192.168.0.1 or 192.168.1.1
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block font-pixel text-xs md:text-sm mb-3">ADMIN_USERNAME</label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="admin"
                className="w-full neo-border p-4 font-mono text-base focus:outline-none focus:ring-4 focus:ring-[#FFD600] bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-pixel text-xs md:text-sm mb-3">ADMIN_PASSWORD</label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full neo-border p-4 font-mono text-base focus:outline-none focus:ring-4 focus:ring-[#FFD600] bg-white"
              />
            </div>

            {/* Polling Interval */}
            <div>
              <label className="block font-pixel text-xs md:text-sm mb-3">
                POLLING_INTERVAL: {config.pollingInterval}s
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="300"
                  value={config.pollingInterval}
                  onChange={(e) => handleInputChange('pollingInterval', parseInt(e.target.value))}
                  className="flex-1 h-4 neo-border bg-white cursor-pointer"
                />
                <div className="neo-card bg-[#FFD600] px-4 py-2 min-w-[80px] text-center font-mono font-bold text-lg">
                  {config.pollingInterval}s
                </div>
              </div>
              <p className="text-xs md:text-sm font-mono text-gray-600 mt-2">
                How often to scan network (10-300 seconds)
              </p>
            </div>
          </div>
        </div>

        <div className="h-6 grid-bg-sm opacity-10 mb-8"></div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <button
            onClick={testConnection}
            disabled={!isFormValid || testing}
            className={`w-full neo-button p-5 md:p-6 font-pixel text-sm md:text-base flex items-center justify-center gap-3 ${
              isFormValid && !testing ? 'bg-[#00E5FF] cursor-pointer' : 'bg-gray-300 cursor-not-allowed opacity-60'
            }`}
          >
            {testing ? (
              <>
                <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                TESTING_CONNECTION...
              </>
            ) : (
              <>
                <Gear size={20} weight="bold" />
                TEST_CONNECTION
              </>
            )}
          </button>

          {testResult?.success && (
            <>
              <button
                onClick={saveConfiguration}
                disabled={saved}
                className={`w-full neo-button p-5 md:p-6 font-pixel text-sm md:text-base flex items-center justify-center gap-3 ${
                  !saved ? 'bg-[#CCFF00] cursor-pointer' : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle size={20} weight="bold" />
                    CONFIGURATION_SAVED
                  </>
                ) : (
                  <>
                    <Gear size={20} weight="bold" />
                    SAVE_CONFIGURATION
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`neo-card p-6 mb-8 ${
              testResult.success ? 'bg-[#CCFF00]' : 'bg-[#FF006E] text-white'
            }`}
          >
            <div className="flex items-start gap-4">
              {testResult.success ? (
                <CheckCircle size={28} weight="bold" className="flex-shrink-0" />
              ) : (
                <XCircle size={28} weight="bold" className="flex-shrink-0" />
              )}
              <div>
                <div className="font-pixel text-sm md:text-base mb-2">
                  {testResult.success ? 'CONNECTION_SUCCESS' : 'CONNECTION_FAILED'}
                </div>
                <div className="text-sm md:text-base font-mono">
                  {testResult.message}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Instructions */}
        {saved && (
          <div className="neo-card bg-[#CCFF00] p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <CheckCircle size={32} weight="bold" className="flex-shrink-0" />
              <div>
                <div className="font-pixel text-sm md:text-base mb-2">CONFIGURATION_SAVED</div>
                <div className="text-sm md:text-base font-mono">
                  Your router is now configured! The monitoring agent will automatically start collecting network data.
                </div>
              </div>
            </div>
            <div className="neo-border bg-white p-4 md:p-6">
              <div className="space-y-3 font-mono text-sm md:text-base">
                <div className="flex items-center gap-3">
                  <span className="text-[#00E5FF] text-xl">✓</span>
                  <span>Configuration automatically saved to agent</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#00E5FF] text-xl">✓</span>
                  <span>Network monitoring service configured</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#00E5FF] text-xl">✓</span>
                  <span>Data collection will begin automatically</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#FFD600] text-xl">→</span>
                  <span><strong>Return to Dashboard</strong> to view connected devices</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-8 grid-bg opacity-20 mb-8"></div>

        {/* Supported Routers Section */}
        <div className="neo-card bg-white p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 bg-[#00E5FF]"></div>
            <h3 className="font-pixel text-base md:text-lg">SUPPORTED_ROUTERS</h3>
          </div>
          <ul className="space-y-4 text-base md:text-lg font-mono">
            <li className="flex items-center gap-3">
              <span className="text-[#FFD600] text-xl">▸</span> 
              <span>D-Link (DIR series)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#FFD600] text-xl">▸</span> 
              <span>TP-Link (Archer)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#FFD600] text-xl">▸</span> 
              <span>Asus (RT-series)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#FFD600] text-xl">▸</span> 
              <span>Generic models</span>
            </li>
          </ul>
          <div className="mt-6 neo-border bg-[#CCFF00] p-4">
            <p className="text-sm md:text-base font-mono">
              <strong>Note:</strong> The Python agent handles router communication. D-Link routers have advanced features like MAC filtering.
            </p>
          </div>
        </div>

        <div className="h-8 grid-bg opacity-20 mb-8"></div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Finding Router Credentials Guide */}
          <div className="neo-card bg-white p-6 rotate-[-0.5deg]">
            <div className="flex items-center gap-3 mb-4">
              <MagnifyingGlass size={20} weight="bold" className="text-[#00E5FF]" />
              <h3 className="font-pixel text-sm md:text-base">FIND_CREDENTIALS</h3>
            </div>
            <div className="space-y-4 text-sm md:text-base font-mono">
              <div>
                <div className="font-bold text-[#FF006E] mb-2">Router IP Address:</div>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD600]">•</span>
                    <span>Check router label/sticker</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD600]">•</span>
                    <span>Usually: 192.168.0.1 or 192.168.1.1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD600]">•</span>
                    <span>CMD: <code className="neo-border-thin bg-black text-[#CCFF00] px-1 text-xs">ipconfig</code> (Windows)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="font-bold text-[#FF006E] mb-2">Username & Password:</div>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00E5FF]">•</span>
                    <span>Check router bottom label</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00E5FF]">•</span>
                    <span>Default: admin/admin or admin/password</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00E5FF]">•</span>
                    <span>Check router manual/box</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="neo-card bg-white p-6 rotate-[0.5deg]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-[#FF006E]"></div>
              <h3 className="font-pixel text-sm md:text-base">QUICK_TIPS</h3>
            </div>
            <ul className="space-y-2 text-sm md:text-base font-mono">
              <li className="flex items-center gap-2">
                <span className="text-[#00E5FF]">→</span> Test connection first
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00E5FF]">→</span> Use strong password
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00E5FF]">→</span> 30s polling = optimal
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00E5FF]">→</span> Save config before leaving
              </li>
            </ul>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="font-mono text-sm md:text-base text-gray-600 hover:text-black no-underline transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center">
        <div className="h-16 dot-bg opacity-10 neo-border mb-5"></div>
        <p className="text-xs font-mono text-gray-500">
          EdgeNet - Universal Router Monitor
        </p>
      </footer>
    </main>
  );
}