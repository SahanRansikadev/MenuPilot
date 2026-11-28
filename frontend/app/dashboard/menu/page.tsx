"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Coffee,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Soup,
  Utensils,
  Users,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";

const navigation = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guest profile", href: "/dashboard/guests", Icon: Users },
  { label: "My bookings", href: "/dashboard/bookings", Icon: CalendarDays },
  { label: "Menus", href: "/dashboard/menu", Icon: Utensils },
];

const properties = [
  {
    name: "Villa Serene",
    location: "Galle, Southern Province",
    description: "A relaxed coastal menu featuring fresh local ingredients.",
    meals: [
      { name: "Breakfast", items: "Coconut pancakes, tropical fruit platter, string hoppers with dhal", note: "Vegetarian options available", Icon: Coffee },
      { name: "Lunch", items: "Grilled catch of the day, red rice, garden salad, lime curry", note: "Fresh seafood · Vegan curry on request", Icon: Soup },
      { name: "Dinner", items: "Roast chicken with herbs, jackfruit curry, watalappan", note: "Ask about today's catch", Icon: Utensils },
    ],
  },
  {
    name: "Harbor House",
    location: "Colombo, Western Province",
    description: "A bright city stay with Sri Lankan favourites and light bites.",
    meals: [
      { name: "Breakfast", items: "Egg hoppers, pol roti, seasonal fruit, Ceylon tea", note: "Gluten-free choices available", Icon: Coffee },
      { name: "Lunch", items: "Chicken biryani, cashew curry, cucumber sambol", note: "Vegetarian biryani available", Icon: Soup },
      { name: "Dinner", items: "Pepper crab, coconut rice, mixed vegetable curry, curd and treacle", note: "Seafood · Dairy-free dessert available", Icon: Utensils },
    ],
  },
  {
    name: "Mountain Table",
    location: "Ella, Uva Province",
    description: "Comforting hill-country dishes made with seasonal produce.",
    meals: [
      { name: "Breakfast", items: "Warm oats, local honey, fresh fruit, vegetable omelette", note: "Vegan breakfast available", Icon: Coffee },
      { name: "Lunch", items: "Pumpkin soup, roast vegetable wraps, green salad", note: "Vegetarian · Gluten-free on request", Icon: Soup },
      { name: "Dinner", items: "Black pork curry, red rice, beetroot curry, jaggery pudding", note: "A mild curry option is available", Icon: Utensils },
    ],
  },
  {
    name: "Golden Palm",
    location: "Bentota, Southern Province",
    description: "A tropical resort menu with beachside classics and island flavours.",
    meals: [
      { name: "Breakfast", items: "Pittu, coconut sambol, banana pancakes, fresh juice", note: "Vegan options available", Icon: Coffee },
      { name: "Lunch", items: "Tuna steak, lemon rice, grilled vegetables, passionfruit salad", note: "Fresh catch · Vegetarian plate available", Icon: Soup },
      { name: "Dinner", items: "Seafood curry, string hoppers, lentil dhal, coconut cream tart", note: "Mild and spicy versions available", Icon: Utensils },
    ],
  },
];

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

export default function MenuPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        const result: { user?: AuthenticatedUser; error?: string } = await response.json();
        if (!response.ok || !result.user) {
          throw new Error(result.error || "Unable to load your account.");
        }
        if (active) setUser(result.user);
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : "Unable to load your account.");
        }
      } finally {
        if (active) setAuthLoading(false);
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
      if (!response.ok) throw new Error(result.error || "Unable to sign out.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
      setSigningOut(false);
    }
  }

  const initials = user?.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MP";

  return (
    <main className="guest-dashboard">
      {sidebarOpen && <button className="dashboard-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/dashboard">
          <span className="dashboard-brand-icon" aria-hidden="true" />
          <span>Menu<span>Pilot</span><small>GUEST PORTAL</small></span>
        </Link>
        <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        <div className="guest-profile">
          <span className="guest-avatar">{initials}</span>
          <span><b>{user?.name || (authLoading ? "Loading..." : "Account unavailable")}</b><small>{user?.email || "Your personal space"}</small></span>
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
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div><b>Need a hand?</b><small>Our team is here to help.</small></div>
            <a href="/#contact" aria-label="Contact support"><ArrowUpRight size={16} /></a>
          </div>
          <button className="sidebar-logout" onClick={handleSignOut} disabled={signingOut}>
            <LogOut size={17} /> {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <button className="dashboard-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><MenuIcon size={20} /></button>
            <span>Workspace</span><ChevronRight size={15} /><b>Menus</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">Friday, 27 November 2026</span>
            <button className="dashboard-bell" aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="dashboard-account">
              <span className="top-avatar">{initials}</span>
              <span className="dashboard-account-info"><b>{user?.name || (authLoading ? "Loading..." : "Account unavailable")}</b><small>{user?.email || ""}</small></span>
            </div>
          </div>
        </header>

        <div className="dashboard-content dashboard-section-content">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><i /> MENUS BY PROPERTY</div>
              <h1>Property menus</h1>
              <p>Browse sample menus for each hotel and venue.</p>
            </div>
          </section>
          {authError && <p className="dashboard-auth-error" role="alert">{authError}</p>}
          <section className="menu-grid" aria-label="Hotel menus">
            {properties.map((property) => {
              const isExpanded = expandedProperty === property.name;
              return (
                <article className="menu-property-card" key={property.name}>
                  <div className="menu-property-heading">
                    <div><h2>{property.name}</h2><p>{property.location}</p></div>
                    <span className="menu-demo-badge">DEMO MENU</span>
                  </div>
                  <p className="menu-property-description">{property.description}</p>
                  <button
                    className="menu-view-button"
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedProperty(isExpanded ? null : property.name)}
                  >
                    {isExpanded ? "Hide menu" : "View menu"} <ArrowUpRight size={14} />
                  </button>
                  {isExpanded && (
                    <div className="menu-meal-list">
                      {property.meals.map(({ name, items, note, Icon }) => (
                        <div className="menu-meal" key={name}>
                          <span className="menu-meal-icon"><Icon size={15} /></span>
                          <div><h3>{name}</h3><p>{items}</p><small>{note}</small></div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
          <p className="menu-demo-note">Sample menus are for demonstration only. Menu items and dietary options may vary by property.</p>
          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}
