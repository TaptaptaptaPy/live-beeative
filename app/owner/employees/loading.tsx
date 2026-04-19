export default function EmployeesLoading() {
  const pulse = "animate-pulse bg-gray-200 dark:bg-[#2A2A2A] rounded-xl";
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className={`${pulse} h-7 w-44 mt-2`} />
      <div className={`${pulse} h-32 rounded-2xl`} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`${pulse} h-20 rounded-2xl`} />
      ))}
    </div>
  );
}
