import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 gap-1.5" : "py-12 gap-3",
        className
      )}
    >
      <div className={cn("select-none", compact ? "text-3xl" : "text-5xl")}>{icon}</div>
      <div>
        <p className={cn("font-semibold text-gray-700 dark:text-gray-300", compact ? "text-sm" : "text-base")}>
          {title}
        </p>
        {description && (
          <p className={cn("text-gray-400 dark:text-gray-500 mt-0.5", compact ? "text-xs" : "text-sm")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
