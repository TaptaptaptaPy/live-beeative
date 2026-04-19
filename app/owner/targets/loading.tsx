export default function TargetsLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className={`${pulse} h-7 w-44 mt-2`} />
      <div className={`${pulse} h-12 rounded-2xl`} />
      <div className="flex items-center gap-2">
        <div className={`${pulse} h-10 w-10`} />
        <div className={`${pulse} h-5 flex-1`} />
        <div className={`${pulse} h-10 w-10`} />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`${pulse} h-20 rounded-2xl`} />
      ))}
      <div className={`${pulse} h-40 rounded-2xl`} />
    </div>
  );
}
