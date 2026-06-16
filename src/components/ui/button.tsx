import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-700 text-white hover:bg-indigo-800",
        secondary: "bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
        outline:
          "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
        ghost: "text-stone-700 hover:bg-stone-100",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        gold: "bg-amber-500 text-stone-900 hover:bg-amber-600",
        whatsapp: "bg-[#25D366] text-white hover:bg-[#1ebe5b]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
