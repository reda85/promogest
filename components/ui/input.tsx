import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-[#e8e6e1] bg-white px-3 py-1 text-sm text-[#1a1a1a] placeholder:text-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#c9773f]/30 focus:border-[#c9773f] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
