'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface HourlyData {
  hour: string;
  connections: number;
}

interface HourlyPatternsChartProps {
  timeRange: '24h' | '7d' | '30d';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="neo-card bg-[#FF006E] text-white p-3 text-xs font-mono">
        <div className="mb-1">{payload[0].payload.hour}</div>
        <div>{payload[0].value} devices</div>
      </div>
    );
  }
  return null;
};

export function HourlyPatternsChart({ timeRange }: HourlyPatternsChartProps) {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHourlyData();
  }, [timeRange]);

  const fetchHourlyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/statistics/hourly-patterns?range=${timeRange}`);
      if (response.ok) {
        const jsonData = await response.json();
        
        // Group by hour and sum across days
        const hourlyMap = new Map<number, number>();
        
        jsonData.data.forEach((d: any) => {
          const hour = d.hour;
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + d.value);
        });
        
        // Create array with all 24 hours
        const parsed = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          connections: Math.round(hourlyMap.get(i) || 0)
        }));
        
        setData(parsed);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Failed to fetch hourly patterns:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-gray-400 text-sm font-mono">
        LOADING_HOURLY_DATA...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">⏰</div>
          <div className="text-gray-400 text-sm font-mono">NO_DATA_FOUND</div>
          <div className="text-gray-400 text-xs font-mono mt-1">Hourly patterns data not available</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="0" stroke="#000000" strokeWidth={2} />
        <XAxis dataKey="hour" stroke="#000000" strokeWidth={2} style={{ fontFamily: 'Space Mono', fontSize: '12px' }} />
        <YAxis stroke="#000000" strokeWidth={2} style={{ fontFamily: 'Space Mono', fontSize: '12px' }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="connections" stroke="#000000" strokeWidth={4} fill="#CCFF00" />
      </AreaChart>
    </ResponsiveContainer>
  );
}