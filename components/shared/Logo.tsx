import { cn } from "@/lib/utils";

/**
 * PromoGest brand mark — an ascending skyline (growth + real estate),
 * rendered on the brand gradient. Used everywhere the app needs its icon:
 * sidebar, auth pages, landing page nav/footer.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-[#c9773f] to-[#9c5a2e] flex-shrink-0",
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[55%] w-[55%]" xmlns="http://www.w3.org/2000/svg">
        <rect x="3"  y="13" width="4.5" height="8"  rx="1" fill="white" fillOpacity="0.75" />
        <rect x="9.75" y="7.5" width="4.5" height="13.5" rx="1" fill="white" />
        <rect x="16.5" y="3.5" width="4.5" height="17.5" rx="1" fill="white" fillOpacity="0.92" />
      </svg>
    </div>
  );
}

export function Logo({
  size = "md", withText = true, textClassName,
}: {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  textClassName?: string;
}) {
  const markSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-10 w-10";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={markSize} />
      {withText && (
        <span
          className={cn(
            "font-bold bg-gradient-to-r from-[#c9773f] to-[#9c5a2e] bg-clip-text text-transparent",
            textSize, textClassName
          )}
        >
          PromoGest
        </span>
      )}
    </div>
  );
}
