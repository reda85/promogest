import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "primary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variant === "default" && "bg-stone-900 text-white hover:bg-stone-700",
          variant === "primary" && "text-white hover:opacity-90",
          variant === "primary" && "bg-gradient-to-r from-[#c8956c] to-[#a67c52]",
          variant === "outline" && "border border-[#e8e6e1] bg-white text-stone-700 hover:bg-stone-50",
          variant === "ghost" && "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
          variant === "link" && "text-[#c8956c] underline-offset-4 hover:underline",
          variant === "destructive" && "bg-red-500 text-white hover:bg-red-600",
          size === "default" && "h-9 px-4 py-2 text-sm",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-11 px-8 text-base",
          size === "icon" && "h-9 w-9",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
