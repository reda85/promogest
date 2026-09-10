import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl bg-stone-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-[#aaaaaa]" />
      </div>
      <h3 className="text-base font-semibold text-[#1a1a1a]">{title}</h3>
      {description && <p className="text-sm text-[#888888] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
