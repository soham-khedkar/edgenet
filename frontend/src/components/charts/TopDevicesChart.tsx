'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TopDeviceData {
  device: string;
  usage: number;
  color: string;
}

interface TopDevicesChartProps {
  // No props needed - fetches all-time top devices
}

const COLORS = ['#FFD600', '#00E5FF', '#FF006E', '#CCFF00', '#FF6B00'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="neo-card bg-[#00E5FF] p-3 text-xs font-mono">
        <div className="mb-1">{payload[0].payload.device}</div>
        <div>{payload[0].value?.toFixed(2)} GB</div>
      </div>
    );
  }
  return null;
};

export function TopDevicesChart({}: TopDevicesChartProps) {
  const [data, setData] = useState<TopDeviceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopDevices();
  }, []);

  const fetchTopDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/statistics/top-devices`);
      if (response.ok) {
        const jsonData = await response.json();
        const parsed = jsonData.data.map((d: any, i: number) => ({
          device: d.deviceName || 'Unknown',
          usage: d.totalData || 0,
          color: COLORS[i % COLORS.length]
        }));
        setData(parsed);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Failed to fetch top devices:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-gray-400 text-sm font-mono">
        LOADING_TOP_DEVICES...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📶</div>
          <div className="text-gray-400 text-sm font-mono">NO_DATA_FOUND</div>
          <div className="text-gray-400 text-xs font-mono mt-1">Top consumers data not available</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="0" stroke="#000000" strokeWidth={2} />
        <XAxis dataKey="device" stroke="#000000" strokeWidth={2} style={{ fontFamily: 'Space Mono', fontSize: '12px' }} />
        <YAxis stroke="#000000" strokeWidth={2} style={{ fontFamily: 'Space Mono', fontSize: '12px' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="usage" stroke="#000000" strokeWidth={3}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}