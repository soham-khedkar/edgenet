'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';

interface BandwidthDataPoint {
  time: string;
  download: number;
  upload: number;
}

interface BandwidthChartProps {
  timeRange: '24h' | '7d' | '30d';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="neo-card bg-[#FFD600] p-3 text-xs font-mono">
        <div className="mb-1">TIME: {payload[0].payload.time}</div>
        <div className="mb-1">DOWN: {payload[0].value?.toFixed(2)} MB</div>
        <div>UP: {payload[1]?.value?.toFixed(2)} MB</div>
      </div>
    );
  }
  return null;
};

export function BandwidthChart({ timeRange }: BandwidthChartProps) {
  const [data, setData] = useState<BandwidthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBandwidthData();
  }, [timeRange]);

  const fetchBandwidthData = async () => {
    try {
      setLoading(true);
      
      // Fetch devices from Supabase
      const { data: devices, error } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (error) {
        console.error('Error fetching bandwidth data:', error);
        setData([]);
        setLoading(false);
        return;
      }

      // Create bandwidth data points from device data
      const chartData = devices?.slice(0, 10).map((device, index) => {
        const date = new Date(device.last_seen_at);
        return {
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          download: parseFloat((parseInt(device.rx_bytes_total || '0') / (1024 * 1024)).toFixed(2)),
          upload: parseFloat((parseInt(device.tx_bytes_total || '0') / (1024 * 1024)).toFixed(2))
        };
      }).reverse() || [];

      setData(chartData);
    } catch (error) {
      console.error('Failed to fetch bandwidth data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-gray-400 text-sm font-mono">
        LOADING_BANDWIDTH_DATA...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-400 text-sm font-mono">NO_DATA_FOUND</div>
          <div className="text-gray-400 text-xs font-mono mt-1">Start monitoring to see bandwidth usage</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="0" stroke="#000000" strokeWidth={2} />
        <XAxis dataKey="time" stroke="#000000" strokeWidth={2} style={{ fontFamily: 'Space Mono', fontSize: '12px' }} />
        <YAxis stroke="#000000" strokeWidth={2} style={{ fontFamily: 'Space Mono', fontSize: '12px' }} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="download" stroke="#000000" strokeWidth={4} dot={{ fill: '#FFD600', stroke: '#000000', strokeWidth: 3, r: 6 }} />
        <Line type="monotone" dataKey="upload" stroke="#000000" strokeWidth={4} dot={{ fill: '#00E5FF', stroke: '#000000', strokeWidth: 3, r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}