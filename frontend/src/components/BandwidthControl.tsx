'use client';

import { useState, useEffect } from 'react';
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

interface BandwidthSettings {
  wan: {
    enabled: boolean;
    maxBandwidth: number;
  };
  lan1: { enabled: boolean; maxBandwidth: number };
  lan2: { enabled: boolean; maxBandwidth: number };
  lan3: { enabled: boolean; maxBandwidth: number };
  lan4: { enabled: boolean; maxBandwidth: number };
}

export default function BandwidthControl() {
  const [settings, setSettings] = useState<BandwidthSettings>({
    wan: { enabled: false, maxBandwidth: 0 },
    lan1: { enabled: false, maxBandwidth: 0 },
    lan2: { enabled: false, maxBandwidth: 0 },
    lan3: { enabled: false, maxBandwidth: 0 },
    lan4: { enabled: false, maxBandwidth: 0 },
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingSettings, setPendingSettings] = useState<BandwidthSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/get-qos-settings');
      const data = await response.json();
      
      if (data.success && data.settings) {
        // Parse the router's response
        const portData = data.settings.data || {};
        const wan = portData.WAN || {};
        const lan1 = portData.LAN1 || {};
        const lan2 = portData.LAN2 || {};
        const lan3 = portData.LAN3 || {};
        const lan4 = portData.LAN4 || {};
        
        setSettings({
          wan: {
            enabled: wan.max_bandwidth > 0 && wan.egress_bandwidth > 0,
            maxBandwidth: wan.max_bandwidth || 100000,
          },
          lan1: { 
            enabled: lan1.egress_bandwidth > 0,
            maxBandwidth: lan1.max_bandwidth || 100000
          },
          lan2: { 
            enabled: lan2.egress_bandwidth > 0,
            maxBandwidth: lan2.max_bandwidth || 100000
          },
          lan3: { 
            enabled: lan3.egress_bandwidth > 0,
            maxBandwidth: lan3.max_bandwidth || 100000
          },
          lan4: { 
            enabled: lan4.egress_bandwidth > 0,
            maxBandwidth: lan4.max_bandwidth || 100000
          },
        });
      }
    } catch (error) {
      console.error('Error loading QoS settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!pendingSettings) return;

    setLoading(true);
    try {
      // Build port settings object matching router's expected format
      const portSettings: Record<string, any> = {};
      
      // Only include ports that have changes or are enabled
      if (pendingSettings.wan.enabled || pendingSettings.wan.maxBandwidth !== settings.wan.maxBandwidth) {
        portSettings.WAN = {
          max_bandwidth: pendingSettings.wan.maxBandwidth,
          ingress_bandwidth: -1, // -1 = unlimited download
          egress_bandwidth: pendingSettings.wan.enabled ? pendingSettings.wan.maxBandwidth : -1
        };
      }
      
      // Add LAN ports if modified
      const lanPorts = ['lan1', 'lan2', 'lan3', 'lan4'] as const;
      lanPorts.forEach((port, index) => {
        const portName = `LAN${index + 1}`;
        const portData = pendingSettings[port];
        if (portData.enabled || portData.maxBandwidth !== settings[port].maxBandwidth) {
          portSettings[portName] = {
            max_bandwidth: portData.maxBandwidth,
            ingress_bandwidth: -1,
            egress_bandwidth: portData.enabled ? portData.maxBandwidth : -1
          };
        }
      });

      const response = await fetch('http://localhost:5000/set-bandwidth-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portSettings }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSettings(pendingSettings);
        showMessage('success', 'Bandwidth settings saved successfully');
      } else {
        showMessage('error', data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving bandwidth settings:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setLoading(false);
      setPendingSettings(null);
    }
  };

  const PortControl = ({ 
    label, 
    port, 
    enabled, 
    maxBandwidth, 
    onChange,
    disabled = false
  }: { 
    label: string; 
    port: keyof BandwidthSettings; 
    enabled: boolean; 
    maxBandwidth: number; 
    onChange: (enabled: boolean, maxBandwidth: number) => void;
    disabled?: boolean;
  }) => (
    <div className={`glass-panel p-6 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-400"></div>
          <h3 className="font-pixel text-xs md:text-sm">{label}</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            console.log('Toggle clicked:', { enabled, maxBandwidth, willBeEnabled: !enabled });
            onChange(!enabled, maxBandwidth);
          }}
          disabled={disabled || loading}
          className="relative inline-flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-700'}`}>
            <span
              className={`block bg-white w-4 h-4 rounded-full transform transition-transform mt-1 ${enabled ? 'ml-[26px]' : 'ml-[6px]'}`}
            />
          </div>
        </button>
      </div>

      {enabled && !disabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-mono">
              Maximum Bandwidth (Kbps)
            </label>
            <input
              type="number"
              value={maxBandwidth}
              onChange={(e) => onChange(enabled, parseInt(e.target.value) || 0)}
              disabled={loading}
              className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g., 10000"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {maxBandwidth > 0 ? `≈ ${(maxBandwidth / 1024).toFixed(2)} Mbps` : '0 Mbps'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`glass-panel p-4 border-l-4 ${
          message.type === 'success' ? 'border-green-400' : 'border-red-400'
        }`}>
          <p className={`text-sm font-mono ${
            message.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* WAN Port */}
      <PortControl
        label="WAN PORT"
        port="wan"
        enabled={pendingSettings?.wan.enabled ?? settings.wan.enabled}
        maxBandwidth={pendingSettings?.wan.maxBandwidth ?? settings.wan.maxBandwidth}
        onChange={(enabled, maxBandwidth) => {
          console.log('WAN onChange:', { enabled, maxBandwidth, currentSettings: settings.wan });
          const newSettings = {
            ...(pendingSettings || settings),
            wan: { enabled, maxBandwidth }
          };
          console.log('Setting pendingSettings:', newSettings);
          setPendingSettings(newSettings);
        }}
      />

      {/* LAN Ports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PortControl
          label="LAN1 PORT"
          port="lan1"
          enabled={pendingSettings?.lan1.enabled ?? settings.lan1.enabled}
          maxBandwidth={pendingSettings?.lan1.maxBandwidth ?? settings.lan1.maxBandwidth}
          onChange={(enabled, maxBandwidth) => {
            const newSettings = {
              ...(pendingSettings || settings),
              lan1: { enabled, maxBandwidth }
            };
            setPendingSettings(newSettings);
          }}
        />
        <PortControl
          label="LAN2 PORT"
          port="lan2"
          enabled={pendingSettings?.lan2.enabled ?? settings.lan2.enabled}
          maxBandwidth={pendingSettings?.lan2.maxBandwidth ?? settings.lan2.maxBandwidth}
          onChange={(enabled, maxBandwidth) => {
            const newSettings = {
              ...(pendingSettings || settings),
              lan2: { enabled, maxBandwidth }
            };
            setPendingSettings(newSettings);
          }}
        />
        <PortControl
          label="LAN3 PORT"
          port="lan3"
          enabled={pendingSettings?.lan3.enabled ?? settings.lan3.enabled}
          maxBandwidth={pendingSettings?.lan3.maxBandwidth ?? settings.lan3.maxBandwidth}
          onChange={(enabled, maxBandwidth) => {
            const newSettings = {
              ...(pendingSettings || settings),
              lan3: { enabled, maxBandwidth }
            };
            setPendingSettings(newSettings);
          }}
        />
        <PortControl
          label="LAN4 PORT"
          port="lan4"
          enabled={pendingSettings?.lan4.enabled ?? settings.lan4.enabled}
          maxBandwidth={pendingSettings?.lan4.maxBandwidth ?? settings.lan4.maxBandwidth}
          onChange={(enabled, maxBandwidth) => {
            const newSettings = {
              ...(pendingSettings || settings),
              lan4: { enabled, maxBandwidth }
            };
            setPendingSettings(newSettings);
          }}
        />
      </div>

      {/* Save Button */}
      {pendingSettings && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={loading}
              className="w-full neo-button bg-blue-500 hover:bg-blue-600 text-white font-pixel text-xs py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'SAVING...' : 'SAVE_CHANGES'}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-black border-2 border-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-pixel text-white">CONFIRM_CHANGES</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 font-mono text-sm">
                Are you sure you want to apply these bandwidth settings? This will affect network traffic immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="neo-button bg-gray-700 hover:bg-gray-600 text-white font-pixel text-xs">
                CANCEL
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSave}
                className="neo-button bg-blue-500 hover:bg-blue-600 text-white font-pixel text-xs"
              >
                APPLY
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
