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
    <div className="neo-card bg-white p-5 max-h-[700px] overflow-y-auto">
      <div className="space-y-3">
        {Object.keys(devicesByBand).length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-mono text-sm">
            <div className="w-14 h-14 rounded-full bg-gray-200 neo-border mx-auto mb-4 flex items-center justify-center">
              <Folder size={24} />
            </div>
            <p>No devices detected</p>
            <p className="text-xs mt-2">Waiting for router data...</p>
          </div>
        ) : (
          Object.entries(devicesByBand).map(([network, networkDevices]) => (
            <div key={network}>
              {/* Network Folder */}
              <button
                onClick={() => toggleNetwork(network)}
                className="neo-button bg-transparent w-full flex items-center gap-4 px-4 py-3"
                style={{ borderColor: getNetworkColor(network) }}
              >
                <CaretRight 
                  size={20} 
                  weight="bold"
                  className={`transition-transform flex-shrink-0 ${expandedNetworks.has(network) ? 'rotate-90' : ''}`}
                />
                <div className="flex items-center gap-3 flex-1">
                  <Folder size={28} weight="bold" style={{ color: getNetworkColor(network) }} className="flex-shrink-0" />
                  <span className="font-mono text-base md:text-lg font-semibold">{network}</span>
                   <span 
                  className="ml-auto text-lg md:text-xl font-bold px-3 py-1.5 rounded flex-shrink-0"
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
                <div className="ml-8 mt-3 space-y-3">
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
                        className={`neo-card p-4 ${isSelected ? 'bg-[#CCFF00]' : 'bg-white rotate-[-0.5deg] hover:rotate-0'} transition-all`}
                        style={{ borderColor: deviceColor, borderWidth: '4px' }}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Device Icon */}
                          <div 
                            className="neo-border p-3 w-16 h-16 flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: deviceColor }}
                          >
                            <DeviceIcon size={32} weight="bold" />
                          </div>

                          {/* Device Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-pixel text-xs mb-2">
                                  {device.hostname || 'Unknown'}
                                </h3>
                                <div className="font-mono text-[11px] space-y-1 leading-relaxed">
                                  <div>IP: {device.ip_address || device.ipv4 || 'N/A'}</div>
                                  <div className="text-gray-600">
                                    MAC: {device.mac_address || device.mac}
                                  </div>
                                </div>
                              </div>
                              {device.signal_strength && device.signal_strength > 0 && (
                                <div className="neo-border-thin px-2 py-1 font-pixel text-[8px] bg-[#CCFF00]">
                                  ONLINE
                                </div>
                              )}
                            </div>

                            {/* Stats */}
                            {device.signal_strength && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="neo-border-thin bg-[#F5F5F5] p-2">
                                  <div className="text-[8px] font-mono mb-1">SIGNAL</div>
                                  <div className="text-sm font-bold">{device.signal_strength}%</div>
                                </div>
                                <div className="neo-border-thin bg-[#F5F5F5] p-2">
                                  <div className="text-[8px] font-mono mb-1">BAND</div>
                                  <div className="text-sm font-bold">{network}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Control Buttons */}
                          <div className="flex md:flex-col gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="neo-button bg-white p-2.5"
                                  title="Device Info"
                                  onClick={() => setSelectedDevice(isSelected ? null : device.mac_address || null)}
                                >
                                  <Info size={16} weight="bold" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <div className="font-mono text-sm space-y-2">
                                  <div className="font-pixel font-bold">{device.hostname || 'Unknown'}</div>
                                  <div>IP: {device.ip_address || device.ipv4 || 'N/A'}</div>
                                  <div>MAC: {device.mac_address || device.mac || 'N/A'}</div>
                                  <div>BAND: {device.band || 'N/A'}</div>
                                  <div>SIGNAL: {device.signal_strength ?? 'N/A'}</div>
                                  <div>RX: {device.rx_bytes_total ?? 'N/A'}</div>
                                  <div>TX: {device.tx_bytes_total ?? 'N/A'}</div>
                                  <div className="text-xs text-gray-500">Status: {device.connection_status || (device.signal_strength ? 'online' : 'offline')}</div>
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
