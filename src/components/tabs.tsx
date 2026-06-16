"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="mb-4 flex rounded-xl bg-stone-100 p-1">
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              active === i
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-stone-500",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
