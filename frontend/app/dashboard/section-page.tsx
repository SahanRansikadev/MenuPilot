"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Utensils,
  Users,
  X,
} from "lucide-react";

type DashboardSection = "bookings";

const navigation = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guest profile", href: "/dashboard/guests", Icon: Users },
  { label: "My bookings", href: "/dashboard/bookings", Icon: CalendarDays },
  { label: "Menus", href: "/dashboard/menu", Icon: Utensils },
];

const pageDetails: Record<DashboardSection, { title: string; eyebrow: string; description: string }> = {
  bookings: {
    title: "My bookings",
    eyebrow: "YOUR STAYS & EVENTS",
    description: "Review your upcoming stays, events, and booking details.",
  },
};

type SavedBooking = {
  id: string;
  date: string;
  guestCount: number;
  childrenCount: number;
  driverCount: number;
  guideCount: number;
  meals: Array<{
    type: string;
    name?: string;
    time: string;
    foods: Array<{ id: string; name: string }>;
    hasIngredients?: boolean;
    ingredients?: Array<{ id: string; name: string }>;
  }>;
  isVegetarian: boolean;
  hasAllergies: boolean;
  allergyCount: number;
  notes: string;
};

function formatBookingDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function DashboardSectionPage({ section }: { section: DashboardSection }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState<SavedBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(section === "bookings");
  const [bookingError, setBookingError] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const page = pageDetails[section];

  useEffect(() => {
    if (section !== "bookings") return;

    let active = true;
    async function loadBookings() {
      try {
        const response = await fetch(`${API_BASE_URL}/bookings`, { credentials: "include" });
        const result: { bookings?: SavedBooking[]; error?: string } = await response.json();

        if (response.status === 401) {
          router.replace("/");
          return;
        }
        if (!response.ok || !result.bookings) {
          throw new Error(result.error || "Unable to load your bookings.");
        }
        if (active) setBookings(result.bookings);
      } catch (error) {
        if (active) {
          setBookingError(error instanceof Error ? error.message : "Unable to load your bookings.");
        }
      } finally {
        if (active) setBookingsLoading(false);
      }
    }

    void loadBookings();
    return () => {
      active = false;
    };
  }, [router, section]);

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
          <span className="guest-avatar">MP</span>
          <span><b>MenuPilot guest</b><small>Your personal space</small></span>
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
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div><b>Need a hand?</b><small>Our team is here to help.</small></div>
            <a href="/#contact" aria-label="Contact support"><ArrowUpRight size={16} /></a>
          </div>
          <Link className="sidebar-logout" href="/"><LogOut size={17} /> Back to MenuPilot</Link>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <button className="dashboard-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <span>Workspace</span><ChevronRight size={15} /><b>{page.title}</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">Friday, 27 November 2026</span>
            <button className="dashboard-bell" aria-label="Notifications"><Bell size={19} /><i /></button>
            <span className="top-avatar">MP</span>
          </div>
        </header>

        <div className="dashboard-content dashboard-section-content">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><i /> {page.eyebrow}</div>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
            </div>
          </section>

          {section === "bookings" && (
            <section className="section-page-card" aria-label="Upcoming bookings">
              <div className="section-page-card-heading"><div><h2>My bookings</h2><p>Your saved meal plans and guest details.</p></div><span className="booking-total">{bookings.length} bookings</span></div>
              <div className="section-booking-list">
                {bookingsLoading && <p className="section-booking-message">Loading your bookings...</p>}
                {bookingError && <p className="section-booking-message error" role="alert">{bookingError}</p>}
                {!bookingsLoading && !bookingError && bookings.length === 0 && (
                  <p className="section-booking-message">You have no saved bookings yet. Choose a date from the dashboard calendar to get started.</p>
                )}
                {bookings.map((booking) => (
                  <article className="section-booking-row" key={booking.id}>
                    <span className="recent-booking-icon blue"><CalendarDays size={19} /></span>
                    <div className="section-booking-copy">
                      <h3>{formatBookingDate(booking.date)}</h3>
                      <p>{booking.guestCount} guests · {booking.childrenCount} children</p>
                      <div className="section-booking-meals">
                        {booking.meals.map((meal) => (
                          <div key={`${meal.type}-${meal.time}`}>
                            <span><Utensils size={13} /> {meal.name || meal.type} · {meal.time}</span>
                            <small>{meal.foods.map((food) => food.name).join(", ")}</small>
                            {meal.hasIngredients && meal.ingredients && meal.ingredients.length > 0 && (
                              <small className="section-booking-ingredients">
                                Bringing: {meal.ingredients.map((ingredient) => ingredient.name).join(", ")}
                              </small>
                            )}
                          </div>
                        ))}
                      </div>
                      <span><Users size={14} /> {booking.driverCount} drivers · {booking.guideCount} guides</span>
                      <span><Leaf size={14} /> {booking.isVegetarian ? "Vegetarian guests" : "No vegetarian guests"} · {booking.hasAllergies ? `${booking.allergyCount} guest(s) with allergies` : "No reported allergies"}</span>
                      {booking.notes && <p className="section-booking-notes">{booking.notes}</p>}
                    </div>
                    <span className="booking-status confirmed">Saved</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}
