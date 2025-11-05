'use client';

import { useEffect, useState } from 'react';

const AGENT_API_URL = 'http://localhost:5000';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useRealtimeDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState<'backend' | 'agent' | 'none'>('none');

  const fetchDevices = async () => {
    try {
      setError(null);

      // Try backend first (has cron data from agent)
      try {
        const backendResponse = await fetch(`${BACKEND_API_URL}/api/devices?active=true`, {
          signal: AbortSignal.timeout(3000),
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          
          if (backendData.devices && backendData.devices.length > 0) {
            // Transform backend format to match expected format
            const transformedDevices = backendData.devices.map((device: any) => ({
              mac: device.mac_address,
              hostname: device.hostname,
              ipv4: device.ip_address,
              ip_address: device.ip_address,
              signal_level: device.signal_strength,
              signal_strength: device.signal_strength,
              band: device.band,
              ssid: device.ssid,
              wireless_mode: device.wireless_mode,
              last_tx_rate: device.last_tx_rate,
              rx_bytes: device.rx_bytes_total?.toString() || '0',
              tx_bytes: device.tx_bytes_total?.toString() || '0',
              online_minutes: device.online_minutes,
              power_saving: device.power_saving,
              connection_status: device.connection_status,
              last_seen: device.last_seen_at
            }));

            setDevices(transformedDevices);
            setConnected(true);
            setSource('backend');
            setLoading(false);
            return;
          }
        }
      } catch (backendError) {
        console.log('Backend not available, trying agent...');
      }

      // Fallback to agent (localhost:5000)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${AGENT_API_URL}/devices`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Agent not responding correctly');
        }

        const data = await response.json();

        if (data.success !== false) {
          setDevices(data.devices || []);
          setConnected(data.connected || false);
          setSource('agent');
          if (data.connected) {
            setError(null);
          }
          setLoading(false);
        } else {
          setError(data.message || 'Failed to fetch devices');
          setConnected(false);
          setDevices([]);
          setSource('none');
          setLoading(false);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          setError('No agent running. Please start the EdgeNet agent.');
        } else {
          setError('Unable to connect to data source');
        }
        setConnected(false);
        setDevices([]);
        setSource('none');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setConnected(false);
      setDevices([]);
      setSource('none');
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDevices();

    // Poll every 15 seconds
    const interval = setInterval(fetchDevices, 15000);

    return () => clearInterval(interval);
  }, []);

  return { devices, loading, error, connected, source, refetch: fetchDevices };
}
