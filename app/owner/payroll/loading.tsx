export default function PayrollLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-2">
        <div className={`${pulse} h-7 w-48`} />
        <div className={`${pulse} h-9 w-28`} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className={`${pulse} h-16`} />)}
      </div>
      <div className={`${pulse} h-80 rounded-2xl`} />
      <div className={`${pulse} h-12 rounded-2xl`} />
    </div>
  );
}
