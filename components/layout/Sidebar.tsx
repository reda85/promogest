"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Building2, Users, FileText, TrendingUp,
  Briefcase, Plus, ChevronLeft, ChevronRight, Home, LogOut,
  GitBranch, ShieldCheck, Bell, CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { type Role, ROLES, ROLE_LABELS, ROLE_ALLOWED_ROUTES } from "@/lib/roles";
import { getCurrentRole, setCurrentRole } from "@/lib/role-store";
import { getPendingCount, getPendingCountForRole } from "@/lib/exception-store";
import { getOverdueTachesCount } from "@/lib/supabase/db";

async function handleLogout() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}
  document.cookie = "promogest_mock_auth=; path=/; max-age=0";
  window.location.href = "/login";
}

const ALL_NAV_ITEMS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Tableau de bord", badge: false },
  { href: "/projets",             icon: Building2,       label: "Projets",          badge: false },
  { href: "/clients",             icon: Users,           label: "Clients",          badge: false },
  { href: "/reservations",        icon: FileText,        label: "Réservations",     badge: false },
  { href: "/pipeline",            icon: TrendingUp,      label: "Pipeline",         badge: false },
  { href: "/taches",              icon: CheckSquare,     label: "Tâches",           badge: true  },
  { href: "/notaire",             icon: Briefcase,       label: "Gestion Notaire",  badge: false },
  { href: "/exceptions",          icon: Bell,            label: "Exceptions",       badge: true  },
  { href: "/parametres/workflow", icon: GitBranch,       label: "Workflow",         badge: false },
];

const ALL_QUICK_ACTIONS = [
  { href: "/projets/nouveau",       icon: Building2, label: "Projet",        route: "/projets"      },
  { href: "/clients/nouveau",       icon: Users,     label: "Client",        route: "/clients"      },
  { href: "/reservations/nouvelle", icon: FileText,  label: "Réservation",   route: "/reservations" },
  { href: "/notaire/nouveau",       icon: Briefcase, label: "Envoi Notaire", route: "/notaire"      },
];

const ALL_ROLES = Object.keys(ROLES) as Role[];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed]           = useState(false);
  const [role, setRole]                     = useState<Role>(getCurrentRole);
  const [pendingExceptions, setPendingExceptions] = useState(0);
  const [overdueTaches, setOverdueTaches]   = useState(0);

  // Exception badge: all pending (admin) or the current role's own pending (others)
  useEffect(() => {
    const p = role === "ADMIN" ? getPendingCount() : getPendingCountForRole(role);
    p.then(setPendingExceptions).catch(() => setPendingExceptions(0));
  }, [role, pathname]);

  // Load overdue tasks count for the "Tâches" badge
  useEffect(() => {
    getOverdueTachesCount().then(setOverdueTaches).catch(() => setOverdueTaches(0));
  }, [pathname]);

  const allowedRoutes = ROLE_ALLOWED_ROUTES[role];
  const isAllowed = (href: string) =>
    allowedRoutes.some((r) => href === r || href.startsWith(r + "/"));

  const navItems    = ALL_NAV_ITEMS.filter((item) => isAllowed(item.href));
  const quickActions = ALL_QUICK_ACTIONS.filter((item) => isAllowed(item.route));
  const roleCfg     = ROLE_LABELS[role];

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setCurrentRole(newRole);
    window.location.href = "/dashboard";
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 flex-shrink-0 z-10",
        "bg-gradient-to-b from-[#1a2332] to-[#0f1923]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-white/10", collapsed && "justify-center px-2")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c8956c] to-[#a67c52] flex-shrink-0">
          <Home className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-sm bg-gradient-to-r from-[#c8956c] to-[#e8b89a] bg-clip-text text-transparent">
              PromoGest
            </span>
            <p className="text-[10px] text-white/40">CRM Immobilier</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const badgeCount = item.badge
            ? item.href === "/exceptions"
              ? pendingExceptions
              : item.href === "/taches"
              ? overdueTaches
              : 0
            : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-[#c8956c]/20 text-[#c8956c]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="flex-shrink-0" size={18} />
              {!collapsed && <span className="font-medium flex-1">{item.label}</span>}

              {/* Badge for exceptions */}
              {!collapsed && badgeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1.5">
                  {badgeCount}
                </span>
              )}
              {/* Collapsed badge dot */}
              {collapsed && badgeCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
              )}

              {/* Active dot (when no badge) */}
              {isActive && !collapsed && badgeCount === 0 && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c8956c]" />
              )}
            </Link>
          );
        })}

        {/* Quick Actions */}
        {!collapsed && quickActions.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
              Création rapide
            </p>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white/70 transition-all"
              >
                <Plus className="h-3 w-3" />
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Role switcher */}
      {!collapsed && (
        <div className="border-t border-white/10 px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-1.5 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Rôle actif
          </p>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold border-0 outline-none cursor-pointer transition-colors"
            style={{ backgroundColor: roleCfg.color + "22", color: roleCfg.color }}
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r} style={{ backgroundColor: "#1a2332", color: "white" }}>
                {ROLE_LABELS[r].name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* User footer */}
      <div className={cn("border-t border-white/10 p-3", collapsed && "flex justify-center")}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67c52] text-white text-xs font-bold flex-shrink-0">
              MB
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Marouane B.</p>
              <p className="text-[10px]" style={{ color: roleCfg.color }}>{roleCfg.short}</p>
            </div>
            <button onClick={handleLogout} className="text-white/30 hover:text-white/60 transition-colors" title="Se déconnecter">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67c52] text-white text-xs font-bold">
            MB
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#e8e6e1] shadow-sm text-[#888888] hover:text-[#1a1a1a] transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
