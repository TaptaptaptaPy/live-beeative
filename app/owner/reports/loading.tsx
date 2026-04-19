export default function ReportsLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className={`${pulse} h-7 w-40 mt-2`} />
      <div className="flex gap-2 flex-wrap">
        {[...Array(5)].map((_, i) => <div key={i} className={`${pulse} h-8 w-20`} />)}
      </div>
      <div className={`${pulse} h-52 rounded-2xl`} />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className={`${pulse} h-16`} />)}
      </div>
      <div className={`${pulse} h-48 rounded-2xl`} />
      <div className={`${pulse} h-40 rounded-2xl`} />
      <div className={`${pulse} h-64 rounded-2xl`} />
    </div>
  );
}
