"use client";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = "Rechercher...", value, onChange, className }: SearchInputProps) {
  const [internal, setInternal] = useState("");
  const val = value !== undefined ? value : internal;

  const handleChange = (v: string) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#aaaaaa]" />
      <Input
        className="pl-9 pr-8"
        placeholder={placeholder}
        value={val}
        onChange={(e) => handleChange(e.target.value)}
      />
      {val && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaaaaa] hover:text-[#1a1a1a]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
