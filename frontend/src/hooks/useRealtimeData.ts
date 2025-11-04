'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export function useRealtimeDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchDevices();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('devices-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'devices'
        },
        (payload: any) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setDevices((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setDevices((prev) =>
              prev.map((device) =>
                device.id === payload.new.id ? payload.new : device
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDevices((prev) =>
              prev.filter((device) => device.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDevices(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  return { devices, loading, error, refetch: fetchDevices };
}

export function useRealtimeTelemetry(deviceId?: string) {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    // Initial fetch
    fetchTelemetry();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`telemetry-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_data',
          filter: `device_id=eq.${deviceId}`
        },
        (payload: any) => {
          console.log('New telemetry:', payload);
          setTelemetry((prev) => [payload.new, ...prev].slice(0, 100)); // Keep last 100
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const fetchTelemetry = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const { data } = await supabase
        .from('telemetry_data')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(100);

      setTelemetry(data || []);
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  return { telemetry, loading, refetch: fetchTelemetry };
}
