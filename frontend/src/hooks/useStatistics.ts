'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface StatisticsData {
  totalDevices: number;
  totalBandwidthUsed: string;
  averageDevicesOnline: number;
}

export function useStatistics(timeRange: '24h' | '7d' | '30d' = '24h') {
  const [stats, setStats] = useState<StatisticsData>({
    totalDevices: 0,
    totalBandwidthUsed: '0 GB',
    averageDevicesOnline: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate time range
      const now = new Date();
      const rangeMs = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[timeRange];
      
      const startTime = new Date(now.getTime() - rangeMs).toISOString();

      // Fetch devices within time range
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .gte('last_seen_at', startTime);

      if (devicesError) {
        console.error('Error fetching devices:', devicesError);
        setError('Failed to fetch statistics');
        setLoading(false);
        return;
      }

      // Calculate statistics
      const totalDevices = devices?.length || 0;
      
      // Calculate total bandwidth (sum of rx + tx bytes)
      const totalBytes = devices?.reduce((sum, device) => {
        const rx = parseInt(device.rx_bytes_total || '0');
        const tx = parseInt(device.tx_bytes_total || '0');
        return sum + rx + tx;
      }, 0) || 0;

      // Convert bytes to GB
      const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
      const totalBandwidthUsed = `${totalGB} GB`;

      // Calculate average devices online (simplified - count unique devices)
      const averageDevicesOnline = totalDevices;

      setStats({
        totalDevices,
        totalBandwidthUsed,
        averageDevicesOnline
      });

    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchStatistics };
}
