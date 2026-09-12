"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, User, Building2, Home, CheckSquare, Scale, Loader2 } from "lucide-react";
import { globalSearch, type SearchResult, type SearchResultType } from "@/lib/supabase/db";

const TYPE_META: Record<SearchResultType, { label: string; icon: typeof User; color: string }> = {
  client:  { label: "Clients",  icon: User,        color: "#c9773f" },
  projet:  { label: "Projets",  icon: Building2,   color: "#3b82f6" },
  unite:   { label: "Unités",   icon: Home,        color: "#10b981" },
  tache:   { label: "Tâches",   icon: CheckSquare, color: "#8b5cf6" },
  notaire: { label: "Notaires", icon: Scale,       color: "#ec4899" },
};

const ORDER: SearchResultType[] = ["client", "projet", "unite", "tache", "notaire"];

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  const onChange = (v: string) => {
    setQuery(v);
    if (v.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setOpen(false);
    } else {
      setLoading(true);
    }
  };

  // Debounced search (no synchronous setState in the effect body)
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const res = await globalSearch(term).catch(() => [] as SearchResult[]);
      if (id !== reqId.current) return; // stale
      setResults(res);
      setActive(0);
      setLoading(false);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Cmd/Ctrl+K to focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (r: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r);
    }
  };

  const grouped = ORDER
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full max-w-md sm:max-w-lg">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aaaaaa]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Rechercher un client, un projet, une unité…"
          className="h-12 w-full rounded-xl border border-[#e8e6e1] bg-white pl-11 pr-12 text-base text-[#1a1a1a] placeholder:text-[#aaaaaa] transition-all focus:border-[#c9773f] focus:outline-none focus:ring-2 focus:ring-[#c9773f]/30"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#aaaaaa]" />
        ) : query ? (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#aaaaaa] hover:text-[#1a1a1a]"
            aria-label="Effacer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-[#e8e6e1] bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium text-[#aaaaaa] md:block">
            ⌘K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-[#e8e6e1] bg-white shadow-lg">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-[#aaaaaa]">
              Aucun résultat pour « {query.trim()} »
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-1">
              {grouped.map((g) => {
                const meta = TYPE_META[g.type];
                return (
                  <div key={g.type}>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-[#aaaaaa]">
                      {meta.label}
                    </p>
                    {g.items.map((r) => {
                      const flatIdx = results.indexOf(r);
                      const isActive = flatIdx === active;
                      const Icon = meta.icon;
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          onMouseEnter={() => setActive(flatIdx)}
                          onClick={() => go(r)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                            isActive ? "bg-stone-100" : "hover:bg-stone-50"
                          }`}
                        >
                          <span
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: meta.color + "1a", color: meta.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-[#1a1a1a]">{r.label}</span>
                            {r.sublabel && (
                              <span className="block truncate text-xs text-[#888888]">{r.sublabel}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
