import { Skeleton } from "@/components/ui/Skeleton";

export default function EntriesLoading() {
  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pt-2 space-y-1.5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Filter card */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-9 rounded-xl" />
          <Skeleton className="h-9 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-9 rounded-xl" />
          <Skeleton className="h-9 rounded-xl" />
        </div>
        <Skeleton className="h-10 rounded-xl" />
      </div>

      {/* Summary bar */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] border-l-4 border-l-[#F5D400] flex justify-between items-center">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>

      {/* Entry list */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] border-l-[3px] border-l-gray-200 dark:border-l-[#2A2A2A]">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-8 rounded-lg" />
                  <Skeleton className="h-7 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
