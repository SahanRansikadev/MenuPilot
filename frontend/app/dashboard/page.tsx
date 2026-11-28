"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Sun,
  Utensils,
  Users,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guests", href: "/dashboard/guests", Icon: Users },
  { label: "My bookings", href: "/dashboard/bookings", Icon: CalendarDays },
  { label: "Meal planner", href: "/dashboard/meal-planner", Icon: Utensils },
  { label: "Recent activity", href: "/dashboard/recent-activity", Icon: ClipboardList },
];

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

export default function GuestDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: "include",
        });

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        const result: { user?: AuthenticatedUser; error?: string } = await response.json();
        if (!response.ok || !result.user) {
          throw new Error(result.error || "Unable to load your account.");
        }

        if (active) {
          setUser(result.user);
        }
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : "Unable to load your account.");
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    setAuthError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to sign out.");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
      setSigningOut(false);
    }
  }

  const userInitials =
    user?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";
  const firstName = user?.name.trim().split(/\s+/)[0] || (authLoading ? "..." : "there");

  return (
    <main className="guest-dashboard" id="overview">
      {sidebarOpen && (
        <button
          className="dashboard-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/">
          <span className="dashboard-brand-icon"><Utensils size={20} /></span>
          <span>Menu<span>Pilot</span><small>GUEST PORTAL</small></span>
        </Link>
        <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>

        <div className="guest-profile">
          <span className="guest-avatar">{userInitials}</span>
          <span>
            <b>{user?.name || (authLoading ? "Loading account..." : "Account unavailable")}</b>
            <small>{user?.email || (authLoading ? "Loading profile..." : "")}</small>
          </span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="dashboard-nav" aria-label="Guest dashboard">
          {navigation.map(({ label, href, Icon }) => (
            <Link
              key={label}
              className={pathname === href ? "active" : ""}
              aria-current={pathname === href ? "page" : undefined}
              href={href}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "My bookings" && <span className="nav-count">2</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div><b>Need a hand?</b><small>Our team is here to help.</small></div>
            <a href="/#contact" aria-label="Contact support"><ArrowUpRight size={16} /></a>
          </div>
          <button
            className="sidebar-logout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={17} /> {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <button
              className="dashboard-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span><ChevronRight size={15} /><b>Guest dashboard</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">Friday, 27 November 2026</span>
            <button className="dashboard-bell" aria-label="Notifications">
              <Bell size={19} /><i />
            </button>
            <div className="dashboard-account">
              <span className="top-avatar">{userInitials}</span>
              <span className="dashboard-account-info">
                <b>{user?.name || (authLoading ? "Loading..." : "Account unavailable")}</b>
                <small>{user?.email || ""}</small>
              </span>
            </div>
            <button
              className="dashboard-logout"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut size={15} />
              <span>{signingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {authError && <p className="dashboard-auth-error" role="alert">{authError}</p>}
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><i /> YOUR MENUPILOT SPACE</div>
              <h1>Good morning, {firstName} <Sun size={19} className="welcome-sun" /></h1>
              <p>Here’s what’s happening with your stays and menus.</p>
            </div>
            <Link className="dashboard-plan-link" href="/dashboard/meal-planner">
              <Utensils size={17} /> Plan a meal <ArrowUpRight size={15} />
            </Link>
          </section>

          <section className="dashboard-stats" aria-label="Your dashboard statistics">
            <article className="dashboard-stat">
              <span className="stat-icon blue"><CalendarDays size={19} /></span>
              <div className="stat-label">Upcoming bookings</div>
              <div className="stat-value">02 <span className="stat-caption">this month</span></div>
              <div className="stat-foot"><span className="status-dot green-dot" /> 1 confirmed · 1 to review</div>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon green"><Utensils size={19} /></span>
              <div className="stat-label">Meals selected</div>
              <div className="stat-value">18 <span className="stat-caption">of 24</span></div>
              <div className="stat-progress"><i style={{ width: "75%" }} /></div>
              <div className="stat-foot">6 meal choices left to make</div>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon gold"><ClipboardList size={19} /></span>
              <div className="stat-label">Invitations</div>
              <div className="stat-value">04 <span className="stat-caption">received</span></div>
              <div className="stat-foot"><span className="status-dot gold-dot" /> 1 needs your response</div>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon violet"><Leaf size={19} /></span>
              <div className="stat-label">Food preferences</div>
              <div className="stat-value">03 <span className="stat-caption">saved</span></div>
              <div className="stat-foot"><Check size={14} className="tiny-check" /> Shared with your hosts</div>
            </article>
          </section>

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}
