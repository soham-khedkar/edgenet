'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AGENT_API_URL = 'http://localhost:5000';

export function useRealtimeDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState<'supabase' | 'none'>('none');

  const fetchDevices = async () => {
    try {
      setError(null);

      // Fetch devices from Supabase (agent pushes data here every 30s)
      const { data, error: supabaseError } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setError('Failed to fetch devices from database');
        setConnected(false);
        setDevices([]);
        setSource('none');
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Transform to match expected format
        const transformedDevices = data.map((device: any) => ({
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
        setSource('supabase');
        setLoading(false);
      } else {
        setDevices([]);
        setConnected(false);
        setError('No devices found. Make sure the agent is running locally.');
        setSource('none');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching devices:', err);
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

    // Subscribe to realtime updates from Supabase
    const channel = supabase
      .channel('devices-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchDevices(); // Refetch when data changes
        }
      )
      .subscribe();

    // Also poll every 30 seconds as backup
    const interval = setInterval(fetchDevices, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return { devices, loading, error, connected, source, refetch: fetchDevices };
}
