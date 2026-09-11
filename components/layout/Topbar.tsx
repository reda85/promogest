"use client";
import { Bell } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-[#e8e6e1] bg-white/80 backdrop-blur-sm px-6">
      <div className="min-w-0 flex-1">
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-2">
        <GlobalSearch />
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888888] hover:bg-stone-100 hover:text-[#1a1a1a] transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
