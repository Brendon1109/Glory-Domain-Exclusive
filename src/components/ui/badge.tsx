import * as React from "react";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  default: "bg-stone-100 text-stone-600",
  indigo: "bg-stone-800 text-stone-50",
  amber: "bg-accent-soft text-accent",
  green: "bg-[#e8efe8] text-[#3f6b48]",
  red: "bg-red-50 text-red-700",
  live: "bg-red-600 text-white",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof styles }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide",
        styles[tone],
        className,
      )}
      {...props}
    />
  );
}
