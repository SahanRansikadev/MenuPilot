"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";

type UserRole = "admin" | "kitchenTeam" | "guest";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [accessError, setAccessError] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
        if (response.status === 401) {
          router.replace("/");
          return;
        }
        const result: { user?: { role?: UserRole }; error?: string } = await response.json();
        if (!response.ok || !result.user) {
          throw new Error(result.error || "Unable to verify your account.");
        }

        const role = result.user.role || "guest";
        const onAdminRoute = pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/");
        const onKitchenRoute = pathname === "/dashboard/kitchen" || pathname.startsWith("/dashboard/kitchen/");
        const correctRoute = role === "admin"
          ? onAdminRoute
          : role === "kitchenTeam"
            ? onKitchenRoute
            : !onAdminRoute && !onKitchenRoute;

        if (!correctRoute) {
          router.replace(role === "admin" ? "/dashboard/admin" : role === "kitchenTeam" ? "/dashboard/kitchen" : "/dashboard");
          return;
        }
        if (active) setAuthorized(true);
      } catch (error) {
        if (active) setAccessError(error instanceof Error ? error.message : "Unable to verify your account.");
      }
    }

    setAuthorized(false);
    setAccessError("");
    void checkAccess();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!authorized) {
    return (
      <main className="dashboard-access-state" role={accessError ? "alert" : "status"}>
        {accessError || "Checking your account access..."}
      </main>
    );
  }

  return children;
}
