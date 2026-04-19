export default function InsightsLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-2">
        <div className={`${pulse} h-7 w-44`} />
        <div className={`${pulse} h-9 w-24`} />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className={`${pulse} h-10 w-16`} />)}
      </div>
      <div className={`${pulse} h-28 rounded-2xl`} />
      <div className={`${pulse} h-64 rounded-2xl`} />
      <div className={`${pulse} h-40 rounded-2xl`} />
      <div className={`${pulse} h-40 rounded-2xl`} />
    </div>
  );
}
