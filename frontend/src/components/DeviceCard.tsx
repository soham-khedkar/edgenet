'use client';

import { Device } from '@/types';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const signalLevel = device.signal_level || 0;
  
  const getSignalColor = (level: number) => {
    if (level >= 70) return 'text-green-400';
    if (level >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSignalBars = (level: number) => {
    if (level >= 75) return 4;
    if (level >= 50) return 3;
    if (level >= 25) return 2;
    return 1;
  };

  const formatBytes = (bytes: string | undefined) => {
    if (!bytes) return '0 KB';
    const num = parseInt(bytes);
    if (num >= 1048576) return `${(num / 1048576).toFixed(1)} MB`;
    if (num >= 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${num} B`;
  };

  const bars = getSignalBars(signalLevel);

  const handleBlockDevice = async () => {
    console.log('Block button clicked for device:', device.mac);
    setIsBlocking(true);
    try {
      console.log('Sending request to http://localhost:5000/block-device');
      const response = await fetch('http://localhost:5000/block-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mac: device.mac,
          hostname: device.hostname || 'Unknown Device'
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setBlockSuccess(true);
        setDialogOpen(false);
        setTimeout(() => setBlockSuccess(false), 3000);
      } else {
        alert('Failed to block device: ' + data.message);
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error blocking device:', error);
      alert('Error blocking device. Check console for details.');
      setDialogOpen(false);
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-6 hover:border-blue-500/50 transition-all duration-200 group">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base sm:text-lg text-gray-200 truncate group-hover:text-blue-400 transition-colors">
            {device.hostname || 'Unknown Device'}
          </h3>
          <p className="font-mono text-xs sm:text-sm text-gray-500 mt-1 truncate">
            {device.mac}
          </p>
        </div>
        
        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 sm:gap-1 h-5 sm:h-6 ml-2 sm:ml-3 flex-shrink-0">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1.5 sm:w-2 rounded-sm transition-colors ${
                bar <= bars ? getSignalColor(signalLevel) : 'bg-gray-700'
              }`}
              style={{ height: `${bar * 22}%` }}
            />
          ))}
        </div>
      </div>

      {/* Info Grid */}
      <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
        
        {device.ipv4 && (
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-500 text-xs sm:text-base">IP</span>
            <span className="font-mono text-gray-300 text-xs sm:text-base truncate">{device.ipv4}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center gap-2">
          <span className="text-gray-500 text-xs sm:text-base">Signal</span>
          <span className={`font-mono font-semibold text-xs sm:text-base ${getSignalColor(signalLevel)}`}>
            {signalLevel}%
          </span>
        </div>
        
        {device.band && (
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-500 text-xs sm:text-base">Band</span>
            <span className="text-gray-300 text-xs sm:text-base">{device.band}</span>
          </div>
        )}
        
        {device.last_tx_rate && (
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-500 text-xs sm:text-base">TX Rate</span>
            <span className="text-gray-300 font-mono text-xs sm:text-base truncate">{device.last_tx_rate}</span>
          </div>
        )}

        {/* Bandwidth Usage */}
        <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/10">
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-500 text-xs sm:text-base">↓ RX</span>
            <span className="text-gray-400 font-mono text-xs sm:text-base">{formatBytes(device.rx_bytes)}</span>
          </div>
          <div className="flex justify-between items-center mt-1.5 sm:mt-2 gap-2">
            <span className="text-gray-500 text-xs sm:text-base">↑ TX</span>
            <span className="text-gray-400 font-mono text-xs sm:text-base">{formatBytes(device.tx_bytes)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 sm:mt-6 flex gap-2">
        {/* Info Button with Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-colors text-sm sm:text-base">
              ℹ️ Info
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-gray-900 border border-gray-700 text-gray-200">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg text-blue-400">Device Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">MAC Address:</span>
                  <span className="font-mono">{device.mac}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IP Address:</span>
                  <span className="font-mono">{device.ipv4 || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Signal Strength:</span>
                  <span>{signalLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Band:</span>
                  <span>{device.band || 'N/A'}</span>
                </div>
                {device.last_tx_rate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">TX Rate:</span>
                    <span>{device.last_tx_rate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">RX Bytes:</span>
                  <span className="font-mono">{formatBytes(device.rx_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">TX Bytes:</span>
                  <span className="font-mono">{formatBytes(device.tx_bytes)}</span>
                </div>
                {device.power_saving && (
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-orange-400">⚡ Power Saving Mode Enabled</span>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Block Device Button with AlertDialog */}
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <button 
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors text-sm sm:text-base disabled:opacity-50"
              disabled={blockSuccess}
              onClick={() => {
                console.log('Block button clicked, opening dialog');
                setDialogOpen(true);
              }}
            >
              {blockSuccess ? '✅ Blocked' : '🚫 Block'}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border border-gray-700 text-gray-200 max-w-[90%] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl text-red-400">Block Device?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-sm sm:text-base">
                This will add <span className="font-mono text-white break-all">{device.mac}</span> to the MAC filter list, 
                blocking <strong>{device.hostname || 'this device'}</strong> from accessing the network.
                <br /><br />
                This action can be reversed from the router's MAC filter settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel 
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 w-full sm:w-auto"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Confirm button clicked');
                  handleBlockDevice();
                }}
                disabled={isBlocking}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                {isBlocking ? 'Blocking...' : 'Yes, Block Device'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Power Saving Badge */}
      {device.power_saving && (
        <div className="mt-3 sm:mt-4">
          <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm bg-orange-500/10 text-orange-400 border border-orange-500/20">
            ⚡ Power Saving
          </span>
        </div>
      )}
    </div>
  );
}