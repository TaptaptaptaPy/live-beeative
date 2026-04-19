export default function FinanceLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-2">
        <div className={`${pulse} h-7 w-40`} />
        <div className={`${pulse} h-9 w-28`} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${pulse} h-16`} />
        ))}
      </div>
      <div className={`${pulse} h-40 rounded-2xl`} />
      <div className={`${pulse} h-52 rounded-2xl`} />
      <div className={`${pulse} h-40 rounded-2xl`} />
    </div>
  );
}
