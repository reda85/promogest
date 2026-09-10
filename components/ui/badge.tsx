import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
        variant === "default" && "bg-stone-900 text-white",
        variant === "secondary" && "bg-stone-100 text-stone-800",
        variant === "outline" && "border border-stone-200 text-stone-700",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
