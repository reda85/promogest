import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-[#e8e6e1] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#c8956c]/30 focus:border-[#c8956c] disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
