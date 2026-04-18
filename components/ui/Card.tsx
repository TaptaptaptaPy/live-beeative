import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** visual elevation level */
  level?: 1 | 2 | 3;
  /** adds a bee-yellow left accent border */
  accent?: boolean;
  /** removes padding (slot your own) */
  noPadding?: boolean;
}

export function Card({
  level = 1,
  accent = false,
  noPadding = false,
  className,
  children,
  ...props
}: CardProps) {
  const bg = {
    1: "bg-white dark:bg-[#1A1A1A]",
    2: "bg-[#F9F6EE] dark:bg-[#242424]",
    3: "bg-[#F0EBD8] dark:bg-[#2E2E2E]",
  }[level];

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E5E7EB] dark:border-[#2A2A2A]",
        bg,
        accent && "border-l-4 border-l-[#F5D400]",
        !noPadding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
