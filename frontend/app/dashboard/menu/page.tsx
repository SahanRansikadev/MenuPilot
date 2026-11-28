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

const demoProperties = [
  {
    name: "Villa Serene",
    location: "Galle, Southern Province",
    description: "A relaxed coastal menu featuring fresh local ingredients.",
    meals: [
      { name: "Breakfast", foods: ["Coconut pancakes", "Tropical fruit platter", "String hoppers with dhal"], desserts: [], note: "Vegetarian options available", Icon: Coffee },
      { name: "Lunch", foods: ["Grilled catch of the day", "Red rice", "Garden salad", "Lime curry"], desserts: [], note: "Fresh seafood · Vegan curry on request", Icon: Soup },
      { name: "Dinner", foods: ["Roast chicken with herbs", "Jackfruit curry"], desserts: ["Watalappan"], note: "Ask about today's catch", Icon: Utensils },
    ],
  },
  {
    name: "Harbor House",
    location: "Colombo, Western Province",
    description: "A bright city stay with Sri Lankan favourites and light bites.",
    meals: [
      { name: "Breakfast", foods: ["Egg hoppers", "Pol roti", "Seasonal fruit", "Ceylon tea"], desserts: [], note: "Gluten-free choices available", Icon: Coffee },
      { name: "Lunch", foods: ["Chicken biryani", "Cashew curry", "Cucumber sambol"], desserts: [], note: "Vegetarian biryani available", Icon: Soup },
      { name: "Dinner", foods: ["Pepper crab", "Coconut rice", "Mixed vegetable curry"], desserts: ["Curd and treacle"], note: "Seafood · Dairy-free dessert available", Icon: Utensils },
    ],
  },
  {
    name: "Mountain Table",
    location: "Ella, Uva Province",
    description: "Comforting hill-country dishes made with seasonal produce.",
    meals: [
      { name: "Breakfast", foods: ["Warm oats", "Local honey", "Fresh fruit", "Vegetable omelette"], desserts: [], note: "Vegan breakfast available", Icon: Coffee },
      { name: "Lunch", foods: ["Pumpkin soup", "Roast vegetable wraps", "Green salad"], desserts: [], note: "Vegetarian · Gluten-free on request", Icon: Soup },
      { name: "Dinner", foods: ["Black pork curry", "Red rice", "Beetroot curry"], desserts: ["Jaggery pudding"], note: "A mild curry option is available", Icon: Utensils },
    ],
  },
  {
    name: "Golden Palm",
    location: "Bentota, Southern Province",
    description: "A tropical resort menu with beachside classics and island flavours.",
    meals: [
      { name: "Breakfast", foods: ["Pittu", "Coconut sambol", "Banana pancakes", "Fresh juice"], desserts: [], note: "Vegan options available", Icon: Coffee },
      { name: "Lunch", foods: ["Tuna steak", "Lemon rice", "Grilled vegetables", "Passionfruit salad"], desserts: [], note: "Fresh catch · Vegetarian plate available", Icon: Soup },
      { name: "Dinner", foods: ["Seafood curry", "String hoppers", "Lentil dhal"], desserts: ["Coconut cream tart"], note: "Mild and spicy versions available", Icon: Utensils },
    ],
  },
];

type MenuGroup = {
  hotelName: string;
  mealType: string;
  foods: string[];
  desserts: string[];
  description: string;
};

type HotelBranch = {
  id: string;
  name: string;
  location: string;
};

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
  const [managedMenus, setManagedMenus] = useState<MenuGroup[] | null>(null);
  const [menuError, setMenuError] = useState("");
  const [hotelLocations, setHotelLocations] = useState<Record<string, string>>({});
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

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    async function loadMenus() {
      try {
        const [menuResponse, hotelResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/menus`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/hotels`, { credentials: "include" }),
        ]);
        if (menuResponse.status === 401 || hotelResponse.status === 401) {
          router.replace("/");
          return;
        }
        const menuResult: { menus?: MenuGroup[]; error?: string } = await menuResponse.json();
        const hotelResult: { hotels?: HotelBranch[]; error?: string } = await hotelResponse.json();
        if (!menuResponse.ok || !menuResult.menus) {
          throw new Error(menuResult.error || "Unable to load hotel menus.");
        }
        if (!hotelResponse.ok || !hotelResult.hotels) {
          throw new Error(hotelResult.error || "Unable to load hotel details.");
        }
        if (active) {
          const locationByHotel = new Map(hotelResult.hotels.map((hotel) => [hotel.name.toLocaleLowerCase(), hotel.location]));
          setManagedMenus(menuResult.menus.map((menu) => ({
            ...menu,
            description: menu.description || "",
            foods: menu.foods || [],
            desserts: menu.desserts || [],
          })));
          setHotelLocations(Object.fromEntries(locationByHotel));
        }
      } catch (error) {
        if (active) setMenuError(error instanceof Error ? error.message : "Unable to load hotel menus.");
      }
    }

    void loadMenus();
    return () => {
      active = false;
    };
  }, [authLoading, router]);

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
  const displayProperties = managedMenus === null
    ? []
    : managedMenus.length === 0
      ? demoProperties
      : Array.from(managedMenus.reduce((grouped, menu) => {
          const property = grouped.get(menu.hotelName) || {
            name: menu.hotelName,
            location: hotelLocations[menu.hotelName.toLocaleLowerCase()] || "",
            description: "Browse the available recipes by meal type.",
            meals: [] as Array<{ name: string; foods: string[]; desserts: string[]; note: string; Icon: typeof Coffee }>,
          };
          const Icon = menu.mealType === "Breakfast" ? Coffee : menu.mealType === "Dinner" ? Utensils : Soup;
          property.meals.push({
            name: menu.mealType,
            foods: menu.foods,
            desserts: menu.desserts,
            note: menu.description,
            Icon,
          });
          grouped.set(menu.hotelName, property);
          return grouped;
        }, new Map<string, {
          name: string;
          location: string;
          description: string;
          meals: Array<{ name: string; foods: string[]; desserts: string[]; note: string; Icon: typeof Coffee }>;
        }>()).values());

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
            <span className="dashboard-brand-icon menu-header-logo" aria-hidden="true" />
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
              <p>Browse each hotel's meal types and available recipes.</p>
            </div>
          </section>
          {authError && <p className="dashboard-auth-error" role="alert">{authError}</p>}
          {menuError && <p className="dashboard-auth-error" role="alert">{menuError}</p>}
          {managedMenus === null && !menuError && <p className="section-booking-message">Loading hotel menus...</p>}
          <section className="menu-grid" aria-label="Hotel menus">
            {displayProperties.map((property) => {
              const isExpanded = expandedProperty === property.name;
              return (
                <article className="menu-property-card menu-book-property" key={property.name}>
                  <div className="menu-property-heading">
                    <div><h2>{property.name}</h2><p>{property.location}</p></div>
                    <span className="menu-demo-badge">{managedMenus?.length ? "HOTEL MENU" : "DEMO MENU"}</span>
                  </div>
                  <p className="menu-property-description">{property.description}</p>
                  <button
                    className="menu-view-button"
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedProperty(isExpanded ? null : property.name)}
                  >
                    {isExpanded ? "Close menu" : "View menu"} <ArrowUpRight size={14} />
                  </button>
                  {isExpanded && (
                    <div className="menu-book">
                      <div className="menu-book-title"><span>MENUPILOT · {property.name.toUpperCase()}</span><h3>Today's Menu</h3><p>Carefully prepared for your stay</p></div>
                      <div className="menu-meal-list">
                        {property.meals.map(({ name, foods, desserts, note, Icon }) => (
                          <section className="menu-meal" key={name}>
                            <div className="menu-meal-heading"><span className="menu-meal-icon"><Icon size={15} /></span><div><h4>{name}</h4><small>MENU SELECTION</small></div></div>
                            {!!foods.length && <div className="menu-recipe-category"><h5>Foods</h5><ul>{foods.map((recipe, index) => <li key={`${recipe}-${index}`}>{recipe}</li>)}</ul></div>}
                            {!!desserts.length && <div className="menu-recipe-category dessert"><h5>Desserts</h5><ul>{desserts.map((recipe, index) => <li key={`${recipe}-${index}`}>{recipe}</li>)}</ul></div>}
                            {!foods.length && !desserts.length && <p className="menu-no-recipes">Menu selections will be added soon.</p>}
                            {note && <p className="menu-meal-note">{note}</p>}
                          </section>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
          {managedMenus?.length === 0 && <p className="menu-demo-note">Sample menus are for demonstration only. Menu items and dietary options may vary by property.</p>}
          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}
