'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';

interface DeviceData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface DeviceUsageChartProps {
  // timeRange prop removed - not used in this chart
}

const COLORS = ['#FFD600', '#00E5FF', '#FF006E', '#CCFF00', '#FF6B00'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="neo-card bg-white p-3 text-xs font-mono">
        <div className="mb-1">{payload[0].name}</div>
        <div>{payload[0].value}%</div>
      </div>
    );
  }
  return null;
};

export function DeviceUsageChart({}: DeviceUsageChartProps) {
  const [data, setData] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeviceData();
  }, []);

  const fetchDeviceData = async () => {
    try {
      setLoading(true);
      
      // Fetch devices from Supabase
      const { data: devices, error } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (error) {
        console.error('Error fetching device data:', error);
        setData([]);
        setLoading(false);
        return;
      }

      // Calculate total bandwidth per device
      const devicesWithUsage = devices?.map(device => ({
        name: device.hostname || device.mac_address,
        usage: parseInt(device.rx_bytes_total || '0') + parseInt(device.tx_bytes_total || '0')
      })) || [];

      // Sort by usage and get top 5
      const sortedData = devicesWithUsage
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5);
      
      const total = sortedData.reduce((sum, d) => sum + d.usage, 0);
      
      const parsed = sortedData.map((d, i) => ({
        name: d.name || 'Unknown Device',
        value: total > 0 ? Math.round((d.usage / total) * 100) : 0,
        color: COLORS[i % COLORS.length]
      }));
      
      setData(parsed);
    } catch (error) {
      console.error('Failed to fetch device usage:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-gray-400 text-sm font-mono">
        LOADING_DEVICE_DATA...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📱</div>
          <div className="text-gray-400 text-sm font-mono">NO_DATA_FOUND</div>
          <div className="text-gray-400 text-xs font-mono mt-1">Device usage data not available</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" stroke="#000000" strokeWidth={3}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontFamily: 'Space Mono', fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}