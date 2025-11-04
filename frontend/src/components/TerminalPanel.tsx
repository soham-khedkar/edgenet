'use client';

import { useState, useRef, useEffect } from 'react';
import { Device } from '@/types';

interface TerminalPanelProps {
  devices: Device[];
}

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'device';
  text?: string;
  device?: Device;
}

export default function TerminalPanel({ devices }: TerminalPanelProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'output', text: 'EdgeNet Terminal' },
    { type: 'output', text: 'Type "help" for available commands' },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);

  const commands = ['help', 'devices', 'ping', 'clear', 'about'];

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    
    setHistory(prev => [...prev, { type: 'command', text: `$ ${cmd}` }]);

    switch (trimmed) {
      case 'help':
        setHistory(prev => [
          ...prev,
          { type: 'output', text: 'Available commands:' },
          { type: 'output', text: '  help           - Show this message' },
          { type: 'output', text: '  devices        - List connected devices' },
          { type: 'output', text: '  <device-name>  - Show device details' },
          { type: 'output', text: '  ping           - Check system status' },
          { type: 'output', text: '  clear          - Clear terminal' },
          { type: 'output', text: '  about          - Show version info' },
        ]);
        break;

      case 'devices':
        if (devices.length === 0) {
          setHistory(prev => [...prev, { type: 'output', text: 'No devices connected' }]);
        } else {
          const deviceLines: TerminalLine[] = [
            { type: 'output', text: `Found ${devices.length} device(s):` },
            { type: 'output', text: '' }
          ];
          
          devices.forEach(device => {
            deviceLines.push({ type: 'device', device });
          });
          
          setHistory(prev => [...prev, ...deviceLines]);
        }
        break;

      case 'ping':
        setHistory(prev => [
          ...prev,
          { type: 'output', text: '✓ System online' },
          { type: 'output', text: `✓ ${devices.length} devices connected` },
          { type: 'output', text: '✓ Backend: http://localhost:4000' },
        ]);
        break;

      case 'clear':
        setHistory([
          { type: 'output', text: 'EdgeNet it is mate' },
          { type: 'output', text: 'Type "help" for available commands' },
        ]);
        break;

      case 'about':
        setHistory(prev => [
          ...prev,
          { type: 'output', text: 'EdgeNet it is mate' },
          { type: 'output', text: 'Network Monitor for D-Link DIR-615' },
          { type: 'output', text: 'Built for fun by JexTer' },
        ]);
        break;

      default:
        // Try to find device by hostname or MAC (case-insensitive)
        const foundDevice = devices.find(d => {
          const hostname = d.hostname?.toLowerCase() || '';
          const mac = (d.mac_address || d.mac || '').toLowerCase();
          return hostname === trimmed || mac === trimmed;
        });

        if (foundDevice) {
          const ipAddress = foundDevice.ip_address || foundDevice.ipv4 || 'N/A';
          const signal = foundDevice.signal_strength || foundDevice.signal_level;
          const rxBytes = foundDevice.rx_bytes_total?.toString() || foundDevice.rx_bytes;
          const txBytes = foundDevice.tx_bytes_total?.toString() || foundDevice.tx_bytes;
          const lastSeen = foundDevice.last_seen_at;
          
          setHistory(prev => [
            ...prev,
            { type: 'output', text: `Device Details: ${foundDevice.hostname || 'Unknown'}` },
            { type: 'output', text: '─'.repeat(50) },
            { type: 'output', text: `Hostname:       ${foundDevice.hostname || 'Unknown'}` },
            { type: 'output', text: `MAC Address:    ${foundDevice.mac_address || foundDevice.mac || 'N/A'}` },
            { type: 'output', text: `IP Address:     ${ipAddress}` },
            { type: 'output', text: `SSID:           ${foundDevice.ssid || 'N/A'}` },
            { type: 'output', text: `Signal Level:   ${signal !== undefined ? signal + '%' : 'N/A'}` },
            { type: 'output', text: `Band:           ${foundDevice.band || 'N/A'}` },
            { type: 'output', text: `Wireless Mode:  ${foundDevice.wireless_mode || 'N/A'}` },
            { type: 'output', text: `TX Rate:        ${foundDevice.last_tx_rate || 'N/A'}` },
            { type: 'output', text: `RX Bytes:       ${formatBytes(rxBytes)}` },
            { type: 'output', text: `TX Bytes:       ${formatBytes(txBytes)}` },
            { type: 'output', text: `Power Saving:   ${foundDevice.power_saving ? 'Active' : 'No'}` },
            { type: 'output', text: `Online Time:    ${foundDevice.online_minutes ? `${foundDevice.online_minutes} min` : 'N/A'}` },
            { type: 'output', text: `Last Seen:      ${lastSeen ? new Date(lastSeen).toLocaleString() : 'N/A'}` },
            { type: 'output', text: '─'.repeat(50) },
          ]);
        } else {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: `Command not found: ${trimmed}` },
            { type: 'output', text: 'Type "help" for available commands or enter a device name' },
          ]);
        }
    }
  };

  const formatBytes = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes);
    if (isNaN(num)) return bytes;
    
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(2)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / 1024 / 1024).toFixed(2)} MB`;
    return `${(num / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      executeCommand(input);
      setCommandHistory(prev => [...prev, input]);
      setHistoryIndex(-1);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Up arrow - previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
    
    // Down arrow - next command
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
    
    // Tab autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      const trimmed = input.trim().toLowerCase();
      
      if (trimmed.length > 0) {
        // First try to match commands
        const matchingCommand = commands.find(cmd => cmd.startsWith(trimmed));
        if (matchingCommand) {
          setInput(matchingCommand);
          return;
        }
        
        // Then try to match device names
        const matchingDevice = devices.find(d => {
          const hostname = (d.hostname || '').toLowerCase();
          const mac = (d.mac_address || d.mac || '').toLowerCase();
          return hostname.startsWith(trimmed) || mac.startsWith(trimmed);
        });
        
        if (matchingDevice) {
          setInput(matchingDevice.hostname || matchingDevice.mac_address || matchingDevice.mac || '');
        }
      }
    }
  };

  const getSignalColor = (level: number) => {
    if (level >= 70) return '#CCFF00';
    if (level >= 40) return '#FFD600';
    return '#FF006E';
  };

  return (
    <div className="bg-[#0A0E1A] p-4 h-full flex flex-col font-mono">
      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto mb-3 space-y-2"
      >
        {history.map((line, i) => (
          <div key={i}>
            {line.type === 'command' && (
              <div className="text-[#FFD600] text-sm">{line.text}</div>
            )}
            {line.type === 'output' && (
              <div className="text-gray-400 text-xs leading-relaxed">{line.text}</div>
            )}
            {line.type === 'error' && (
              <div className="text-[#FF006E] text-xs leading-relaxed">{line.text}</div>
            )}
            {line.type === 'device' && line.device && (
              <div className="neo-border-thin bg-[#1a1a1a] p-3 my-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#00E5FF] text-sm font-bold">
                    {line.device.hostname || 'Unknown'}
                  </span>
                  <span 
                    className="text-xs font-bold"
                    style={{ color: getSignalColor(line.device.signal_strength || line.device.signal_level || 0) }}
                  >
                    {line.device.signal_strength || line.device.signal_level}%
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 space-y-1 leading-relaxed">
                  <div>IP: {line.device.ip_address || line.device.ipv4 || 'N/A'}</div>
                  <div>MAC: {line.device.mac_address || line.device.mac || 'N/A'}</div>
                  <div>Band: {line.device.band || 'N/A'} | Mode: {line.device.wireless_mode || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 pt-3 border-t-2 border-[#FFD600]">
          <span className="text-[#FFD600] text-sm">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command..."
            className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder-gray-600 px-2 py-1"
          />
        </div>
      </form>
    </div>
  );
}
