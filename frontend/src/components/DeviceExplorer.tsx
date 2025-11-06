'use client';

import { useState } from 'react';
import { Device } from '@/types';
import { 
  Desktop, 
  DeviceMobile, 
  CaretRight, 
  Folder,
  Info,
} from '@phosphor-icons/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

// Color palette for device cards
const DEVICE_COLORS = ['#FFD600', '#00E5FF', '#FF006E', '#CCFF00', '#FF6B00'];

interface DeviceExplorerProps {
  devices: Device[];
}

export default function DeviceExplorer({ devices }: DeviceExplorerProps) {
  const [expandedNetworks, setExpandedNetworks] = useState<Set<string>>(new Set(['2.4 GHz']));
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // Group devices by band
  const devicesByBand = devices.reduce((acc, device) => {
    const band = device.band || 'Unknown';
    if (!acc[band]) acc[band] = [];
    acc[band].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  const toggleNetwork = (network: string) => {
    const newExpanded = new Set(expandedNetworks);
    if (newExpanded.has(network)) {
      newExpanded.delete(network);
    } else {
      newExpanded.add(network);
    }
    setExpandedNetworks(newExpanded);
  };

  const getDeviceIcon = (hostname: string) => {
    const lower = hostname.toLowerCase();
    if (lower.includes('phone') || lower.includes('iphone') || lower.includes('android')) {
      return DeviceMobile;
    }
    return Desktop;
  };

  const getNetworkColor = (network: string) => {
    if (network.includes('2.4')) return '#FFD600';
    if (network.includes('5')) return '#00E5FF';
    return '#CCFF00';
  };

  return (
    <div className="neo-card bg-white p-3 sm:p-5 max-h-[600px] sm:max-h-[700px] overflow-y-auto overflow-x-hidden">
      <div className="space-y-2 sm:space-y-3">
        {Object.keys(devicesByBand).length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 font-mono text-xs sm:text-sm">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 neo-border mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Folder size={20} className="sm:w-6 sm:h-6" />
            </div>
            <p>No devices detected</p>
            <p className="text-[10px] sm:text-xs mt-2">Waiting for router data...</p>
          </div>
        ) : (
          Object.entries(devicesByBand).map(([network, networkDevices]) => (
            <div key={network}>
              {/* Network Folder */}
              <button
                onClick={() => toggleNetwork(network)}
                className="neo-button bg-transparent w-full flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3"
                style={{ borderColor: getNetworkColor(network) }}
              >
                <CaretRight 
                  size={18} 
                  weight="bold"
                  className={`transition-transform flex-shrink-0 sm:w-5 sm:h-5 ${expandedNetworks.has(network) ? 'rotate-90' : ''}`}
                />
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Folder size={24} weight="bold" style={{ color: getNetworkColor(network) }} className="flex-shrink-0 sm:w-7 sm:h-7" />
                  <span className="font-mono text-sm sm:text-base md:text-lg font-semibold truncate">{network}</span>
                   <span 
                  className="ml-auto text-base sm:text-lg md:text-xl font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded flex-shrink-0"
                  style={{ 
                    color: getNetworkColor(network),
                    backgroundColor: `${getNetworkColor(network)}20`
                  }}
                >
                  {networkDevices.length}
                </span>
                </div>
               
              </button>

              {/* Devices */}
              {expandedNetworks.has(network) && (
                <div className="ml-4 sm:ml-8 mt-2 sm:mt-3 space-y-2 sm:space-y-3">
                  {networkDevices.map((device, index) => 
                  {
                    const DeviceIcon = getDeviceIcon(device.hostname || '');
                    const isSelected = selectedDevice === device.mac_address;
                    // Assign color based on device index in ALL devices array
                    const allDeviceIndex = devices.findIndex(d => d.mac_address === device.mac_address);
                    const deviceColor = DEVICE_COLORS[allDeviceIndex % DEVICE_COLORS.length];
                    
                    return (
                      <div
                        key={device.mac_address || device.mac || `device-${index}`}
                        className={`neo-card p-3 sm:p-4 ${isSelected ? 'bg-[#CCFF00]' : 'bg-white rotate-[-0.5deg] hover:rotate-0'} transition-all`}
                        style={{ borderColor: deviceColor, borderWidth: '3px' }}
                      >
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          {/* Device Icon */}
                          <div 
                            className="neo-border p-2.5 sm:p-3 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
                            style={{ backgroundColor: deviceColor }}
                          >
                            <DeviceIcon size={28} weight="bold" className="sm:w-8 sm:h-8" />
                          </div>

                          {/* Device Info */}
                          <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-pixel text-[10px] sm:text-xs mb-1.5 sm:mb-2 truncate">
                                  {device.hostname || 'Unknown'}
                                </h3>
                                <div className="font-mono text-[9px] sm:text-[11px] space-y-0.5 sm:space-y-1 leading-relaxed">
                                  <div className="truncate">IP: {device.ip_address || device.ipv4 || 'N/A'}</div>
                                  <div className="text-gray-600 truncate">
                                    MAC: {device.mac_address || device.mac}
                                  </div>
                                </div>
                              </div>
                              {device.signal_strength && device.signal_strength > 0 && (
                                <div className="neo-border-thin px-1.5 sm:px-2 py-0.5 sm:py-1 font-pixel text-[7px] sm:text-[8px] bg-[#CCFF00] flex-shrink-0">
                                  ONLINE
                                </div>
                              )}
                            </div>

                            {/* Stats */}
                            {device.signal_strength && (
                              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                <div className="neo-border-thin bg-[#F5F5F5] p-1.5 sm:p-2">
                                  <div className="text-[7px] sm:text-[8px] font-mono mb-0.5 sm:mb-1">SIGNAL</div>
                                  <div className="text-xs sm:text-sm font-bold">{device.signal_strength}%</div>
                                </div>
                                <div className="neo-border-thin bg-[#F5F5F5] p-1.5 sm:p-2">
                                  <div className="text-[7px] sm:text-[8px] font-mono mb-0.5 sm:mb-1">BAND</div>
                                  <div className="text-xs sm:text-sm font-bold truncate">{network}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Control Buttons */}
                          <div className="flex sm:flex-col gap-2 justify-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="neo-button bg-white p-2 sm:p-2.5"
                                  title="Device Info"
                                  onClick={() => setSelectedDevice(isSelected ? null : device.mac_address || null)}
                                >
                                  <Info size={14} weight="bold" className="sm:w-4 sm:h-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="max-w-[90vw] sm:max-w-sm">
                                <div className="font-mono text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                                  <div className="font-pixel font-bold text-[10px] sm:text-xs truncate">{device.hostname || 'Unknown'}</div>
                                  <div className="truncate">IP: {device.ip_address || device.ipv4 || 'N/A'}</div>
                                  <div className="break-all">MAC: {device.mac_address || device.mac || 'N/A'}</div>
                                  <div>BAND: {device.band || 'N/A'}</div>
                                  <div>SIGNAL: {device.signal_strength ?? 'N/A'}</div>
                                  <div>RX: {device.rx_bytes_total ?? 'N/A'}</div>
                                  <div>TX: {device.tx_bytes_total ?? 'N/A'}</div>
                                  <div className="text-[10px] sm:text-xs text-gray-500">Status: {device.connection_status || (device.signal_strength ? 'online' : 'offline')}</div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
