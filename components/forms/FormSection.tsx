import { type LucideIcon } from "lucide-react";

interface FormSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function FormSection({ title, icon: Icon, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c8956c]/10">
          <Icon className="h-4 w-4 text-[#c8956c]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">{title}</h3>
          <div className="mt-2 h-px bg-[#e8e6e1]" />
        </div>
      </div>
      <div className="grid gap-4 pl-11">{children}</div>
    </div>
  );
}
