import { StatCardSkeleton, CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pt-2 space-y-1.5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Period tabs */}
      <Skeleton className="h-10 w-full rounded-2xl" />

      {/* Desktop 2-col grid */}
      <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">

        {/* Left column */}
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          {/* Commission */}
          <CardSkeleton lines={3} />
          {/* Target */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {/* Leaderboard */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-4">
            <Skeleton className="h-4 w-36" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          {/* Platform */}
          <CardSkeleton lines={4} />
          {/* Recent entries */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
