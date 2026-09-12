"use client";
import { Bell } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[#e8e6e1] bg-white/80 backdrop-blur-sm px-6">
      <div />
      <div className="flex justify-center">
        <GlobalSearch />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888888] hover:bg-stone-100 hover:text-[#1a1a1a] transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
