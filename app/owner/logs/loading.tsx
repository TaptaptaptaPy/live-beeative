export default function LogsLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className={`${pulse} h-7 w-44 mt-2`} />
      <div className="flex gap-2 flex-wrap">
        {[...Array(7)].map((_, i) => <div key={i} className={`${pulse} h-8 w-16`} />)}
      </div>
      <div className={`${pulse} h-32 rounded-2xl`} />
      <div className={`${pulse} h-[500px] rounded-2xl`} />
    </div>
  );
}
