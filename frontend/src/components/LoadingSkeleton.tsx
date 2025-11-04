'use client';

export function DeviceCardSkeleton() {
  return (
    <div className="neo-card bg-white p-6 relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute top-0 left-0 w-full h-full shimmer bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-30" />
      
      <div className="relative space-y-4">
        <div className="h-5 bg-gray-200 neo-border-thin w-3/5" />
        <div className="h-4 bg-gray-100 neo-border-thin w-2/5" />
        <div className="space-y-3">
          <div className="h-3 bg-gray-100 neo-border-thin w-4/5" />
          <div className="h-3 bg-gray-100 neo-border-thin w-3/5" />
          <div className="h-3 bg-gray-100 neo-border-thin w-2/5" />
        </div>
      </div>
    </div>
  );
}

export function DeviceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <DeviceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="neo-card bg-white p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full shimmer bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-30" />
      
      <div className="relative">
        <div className="h-6 bg-gray-200 neo-border-thin w-48 mb-6" />
        <div className="h-[300px] bg-gray-100 neo-border" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="neo-card bg-gray-200 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full shimmer bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
      
      <div className="relative space-y-3">
        <div className="h-4 bg-gray-300 neo-border-thin w-1/2" />
        <div className="h-10 bg-gray-300 neo-border-thin w-3/5" />
      </div>
    </div>
  );
}

export function TerminalSkeleton() {
  return (
    <div className="neo-card bg-[#1a1a1a] p-6 relative overflow-hidden min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-full shimmer bg-gradient-to-r from-transparent via-gray-800 to-transparent opacity-30" />
      
      <div className="relative space-y-3">
        <div className="h-3 bg-gray-800 neo-border-thin w-4/5" />
        <div className="h-3 bg-gray-800 neo-border-thin w-3/5" />
        <div className="h-3 bg-gray-800 neo-border-thin w-2/5" />
        <div className="h-3 bg-gray-800 neo-border-thin w-3/5" />
        <div className="h-3 bg-gray-800 neo-border-thin w-4/5" />
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="p-12">
      <div className="h-12 bg-gray-200 neo-border w-72 mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
      </div>
      <div className="mt-12">
        <ChartSkeleton />
      </div>
    </div>
  );
}
