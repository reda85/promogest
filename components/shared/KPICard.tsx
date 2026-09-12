import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, color = "#c9773f", trend, className }: KPICardProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white p-5", className)}>
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[#888888] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#aaaaaa] mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl p-2.5 flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        )}
      </div>
    </div>
  );
}
