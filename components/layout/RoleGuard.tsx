"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentRole } from "@/lib/role-store";
import { isRouteAllowed } from "@/lib/roles";

/**
 * Wraps the app layout — silently redirects to /dashboard if the current
 * user's role is not allowed to visit the current route.
 */
export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Initialise synchronously from localStorage so there is no extra render
  const [role] = useState(getCurrentRole);

  const allowed = isRouteAllowed(role, pathname);

  useEffect(() => {
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router]);

  // Return null immediately on forbidden routes to prevent content flash
  if (!allowed) return null;

  return <>{children}</>;
}
