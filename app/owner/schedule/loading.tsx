export default function ScheduleLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className={`${pulse} h-7 w-36 mt-2`} />
      <div className={`${pulse} h-14 rounded-2xl`} />
      <div className="grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, i) => <div key={i} className={`${pulse} h-14`} />)}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className={`${pulse} h-14`} />)}
      </div>
      <div className={`${pulse} h-32 rounded-2xl`} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`${pulse} h-28 rounded-2xl`} />
      ))}
    </div>
  );
}
