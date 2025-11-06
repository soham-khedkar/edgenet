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
    <main className="min-h-screen bg-[#F5F5F5] px-4 sm:px-6 md:px-10 pb-10">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-64 h-64 dot-bg opacity-5 pointer-events-none"></div>
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-5 gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-pixel mb-2 break-words">STATISTICS</h1>
            <p className="text-[10px] sm:text-xs font-mono text-gray-600">Network analytics and trends</p>
          </div>
          <Link 
            href="/"
            className="neo-button bg-white px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs no-underline flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <CaretLeft size={15} weight="bold" />
            BACK
          </Link>
        </div>
        
        {/* Separator */}
        <div className="h-6 grid-bg opacity-20"></div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center sm:justify-end mb-4 sm:mb-6">
        <div className="neo-border bg-white p-1.5 sm:p-2 flex gap-1.5 sm:gap-2 w-full sm:w-auto">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as typeof timeRange)}
              className={`neo-button px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-[9px] sm:text-[10px] flex-1 sm:flex-none ${
                timeRange === range ? 'bg-[#FFD600]' : 'bg-white'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Devices - Yellow */}
        <div className="neo-card bg-[#FFD600] p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
            <Database size={22} weight="bold" className="sm:w-[26px] sm:h-[26px]" />
            <div className="font-pixel text-[8px] sm:text-[9px]">TOTAL_DEVICES</div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold">
            {loading ? '...' : stats.totalDevices}
          </div>
        </div>

        {/* Total Bandwidth - Cyan */}
        <div className="neo-card bg-[#00E5FF] p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
            <TrendUp size={22} weight="bold" className="sm:w-[26px] sm:h-[26px]" />
            <div className="font-pixel text-[8px] sm:text-[9px]">BANDWIDTH</div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold">
            {loading ? '...' : stats.totalBandwidthUsed}
          </div>
        </div>

        {/* Average Online - Pink */}
        <div className="neo-card bg-[#FF006E] p-4 sm:p-5 text-white sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
            <ChartLine size={22} weight="bold" className="sm:w-[26px] sm:h-[26px]" />
            <div className="font-pixel text-[8px] sm:text-[9px]">AVG_ONLINE</div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold">
            {loading ? '...' : stats.averageDevicesOnline}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bandwidth Chart */}
        <div className="neo-card bg-white p-4 sm:p-5">
          <h3 className="font-pixel text-[10px] sm:text-xs mb-3 sm:mb-4 flex items-center gap-2">
            <ChartLine size={16} weight="bold" className="sm:w-[18px] sm:h-[18px]" />
            BANDWIDTH_USAGE
          </h3>
          <BandwidthChart timeRange={timeRange} />
        </div>

        {/* Device Usage Chart */}
        <div className="neo-card bg-white p-4 sm:p-5">
          <h3 className="font-pixel text-[10px] sm:text-xs mb-3 sm:mb-4 flex items-center gap-2">
            <Database size={16} weight="bold" className="sm:w-[18px] sm:h-[18px]" />
            DEVICE_DISTRIBUTION
          </h3>
          <DeviceUsageChart />
        </div>

        {/* Top Devices Chart */}
        <div className="neo-card bg-white p-4 sm:p-5">
          <h3 className="font-pixel text-[10px] sm:text-xs mb-3 sm:mb-4 flex items-center gap-2">
            <TrendUp size={16} weight="bold" className="sm:w-[18px] sm:h-[18px]" />
            TOP_CONSUMERS
          </h3>
          <TopDevicesChart />
        </div>

        {/* Hourly Patterns Chart */}
        <div className="neo-card bg-white p-4 sm:p-5">
          <h3 className="font-pixel text-[10px] sm:text-xs mb-3 sm:mb-4 flex items-center gap-2">
            <Clock size={16} weight="bold" className="sm:w-[18px] sm:h-[18px]" />
            HOURLY_PATTERNS
          </h3>
          <HourlyPatternsChart timeRange={timeRange} />
        </div>
      </div>
    </main>
  );
}

