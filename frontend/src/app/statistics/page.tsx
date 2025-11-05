'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChartLine, Database, TrendUp, CaretLeft, Clock } from '@phosphor-icons/react';
import { BandwidthChart } from '@/components/charts/BandwidthChart';
import { DeviceUsageChart } from '@/components/charts/DeviceUsageChart';
import { TopDevicesChart } from '@/components/charts/TopDevicesChart';
import { HourlyPatternsChart } from '@/components/charts/HourlyPatternsCharts';
import { useStatistics } from '@/hooks/useStatistics';

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { stats, loading, error } = useStatistics(timeRange);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 md:px-10 pb-10">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-64 h-64 dot-bg opacity-5 pointer-events-none"></div>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-pixel mb-2">STATISTICS</h1>
            <p className="text-xs font-mono text-gray-600">Network analytics and trends</p>
          </div>
          <Link 
            href="/"
            className="neo-button bg-white px-4 py-2.5 font-mono text-xs no-underline flex items-center gap-2"
          >
            <CaretLeft size={15} weight="bold" />
            BACK
          </Link>
        </div>
        
        {/* Separator */}
        <div className="h-6 grid-bg opacity-20"></div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-6">
        <div className="neo-border bg-white p-2 flex gap-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as typeof timeRange)}
              className={`neo-button px-4 py-2 font-mono text-[10px] ${
                timeRange === range ? 'bg-[#FFD600]' : 'bg-white'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Devices - Yellow */}
        <div className="neo-card bg-[#FFD600] p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <Database size={26} weight="bold" />
            <div className="font-pixel text-[9px]">TOTAL_DEVICES</div>
          </div>
          <div className="text-4xl font-bold">
            {loading ? '...' : stats.totalDevices}
          </div>
        </div>

        {/* Total Bandwidth - Cyan */}
        <div className="neo-card bg-[#00E5FF] p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <TrendUp size={26} weight="bold" />
            <div className="font-pixel text-[9px]">BANDWIDTH</div>
          </div>
          <div className="text-4xl font-bold">
            {loading ? '...' : stats.totalBandwidthUsed}
          </div>
        </div>

        {/* Average Online - Pink */}
        <div className="neo-card bg-[#FF006E] p-5 text-white">
          <div className="flex items-center gap-2.5 mb-2">
            <ChartLine size={26} weight="bold" />
            <div className="font-pixel text-[9px]">AVG_ONLINE</div>
          </div>
          <div className="text-4xl font-bold">
            {loading ? '...' : stats.averageDevicesOnline}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bandwidth Chart */}
        <div className="neo-card bg-white p-5">
          <h3 className="font-pixel text-xs mb-4 flex items-center gap-2">
            <ChartLine size={18} weight="bold" />
            BANDWIDTH_USAGE
          </h3>
          <BandwidthChart timeRange={timeRange} />
        </div>

        {/* Device Usage Chart */}
        <div className="neo-card bg-white p-5">
          <h3 className="font-pixel text-xs mb-4 flex items-center gap-2">
            <Database size={18} weight="bold" />
            DEVICE_DISTRIBUTION
          </h3>
          <DeviceUsageChart />
        </div>

        {/* Top Devices Chart */}
        <div className="neo-card bg-white p-5">
          <h3 className="font-pixel text-xs mb-4 flex items-center gap-2">
            <TrendUp size={18} weight="bold" />
            TOP_CONSUMERS
          </h3>
          <TopDevicesChart />
        </div>

        {/* Hourly Patterns Chart */}
        <div className="neo-card bg-white p-5">
          <h3 className="font-pixel text-xs mb-4 flex items-center gap-2">
            <Clock size={18} weight="bold" />
            HOURLY_PATTERNS
          </h3>
          <HourlyPatternsChart timeRange={timeRange} />
        </div>
      </div>
    </main>
  );
}

