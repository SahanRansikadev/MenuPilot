"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Coffee,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  PartyPopper,
  Soup,
  Utensils,
  Users,
  X,
} from "lucide-react";

type DashboardSection = "bookings" | "meal-planner" | "recent-activity";

const navigation = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guests", href: "/dashboard/guests", Icon: Users },
  { label: "My bookings", href: "/dashboard/bookings", Icon: CalendarDays },
  { label: "Meal planner", href: "/dashboard/meal-planner", Icon: Utensils },
  { label: "Recent activity", href: "/dashboard/recent-activity", Icon: ClipboardList },
];

const pageDetails: Record<DashboardSection, { title: string; eyebrow: string; description: string }> = {
  bookings: {
    title: "My bookings",
    eyebrow: "YOUR STAYS & EVENTS",
    description: "Review your upcoming stays, events, and booking details.",
  },
  "meal-planner": {
    title: "Meal planner",
    eyebrow: "MENUS & PREFERENCES",
    description: "Keep track of meal selections for your upcoming bookings.",
  },
  "recent-activity": {
    title: "Recent activity",
    eyebrow: "YOUR LATEST UPDATES",
    description: "A timeline of the latest changes across your MenuPilot space.",
  },
};

const upcomingBookings = [
  { title: "Weekend at Villa Serene", detail: "Breakfast & dinner · 2 guests", date: "5–7 Dec, 2026", status: "Confirmed", location: "Galle, Sri Lanka", Icon: Coffee, tone: "blue" },
  { title: "Garden dinner", detail: "Private event · 6 guests", date: "19 Dec, 2026", status: "Awaiting menu", location: "Colombo, Sri Lanka", Icon: PartyPopper, tone: "gold" },
];

const mealSelections = [
  { label: "Breakfast", count: 8, percent: 80, Icon: Coffee, tone: "blue" },
  { label: "Lunch", count: 6, percent: 60, Icon: Soup, tone: "green" },
  { label: "Dinner", count: 4, percent: 40, Icon: Utensils, tone: "gold" },
];

const recentActivity = [
  { title: "Booking confirmed", detail: "Weekend at Villa Serene · 5–7 Dec, 2026", time: "Today, 10:42 AM", Icon: Check, tone: "green" },
  { title: "Meal preferences updated", detail: "Vegetarian preference saved for your profile", time: "Yesterday, 4:18 PM", Icon: Leaf, tone: "violet" },
  { title: "New booking invitation", detail: "Garden dinner · 19 Dec, 2026", time: "Nov 25, 2026 · 11:06 AM", Icon: CalendarDays, tone: "gold" },
];

export default function DashboardSectionPage({ section }: { section: DashboardSection }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const page = pageDetails[section];

  return (
    <main className="guest-dashboard">
      {sidebarOpen && <button className="dashboard-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/dashboard">
          <span className="dashboard-brand-icon"><Utensils size={20} /></span>
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
              <div className="section-page-card-heading"><div><h2>Upcoming bookings</h2><p>Your confirmed stays and plans to review.</p></div><span className="booking-total">{upcomingBookings.length} bookings</span></div>
              <div className="section-booking-list">
                {upcomingBookings.map(({ title, detail, date, status, location, Icon, tone }) => (
                  <article className="section-booking-row" key={title}>
                    <span className={`recent-booking-icon ${tone}`}><Icon size={19} /></span>
                    <div className="section-booking-copy">
                      <h3>{title}</h3>
                      <p>{detail}</p>
                      <span><CalendarDays size={14} /> {date}</span>
                      <span><MapPin size={14} /> {location}</span>
                    </div>
                    <span className={`booking-status ${status === "Confirmed" ? "confirmed" : "pending"}`}>{status}</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {section === "meal-planner" && (
            <div className="section-page-grid">
              <section className="section-page-card">
                <div className="section-page-card-heading"><div><h2>Meal selections</h2><p>Selections across your upcoming bookings.</p></div><span className="booking-total">18 of 24 selected</span></div>
                <div className="meal-bars">
                  {mealSelections.map(({ label, count, percent, Icon, tone }) => (
                    <div className="meal-bar-row" key={label}>
                      <span className={`meal-type-icon ${tone}`}><Icon size={17} /></span>
                      <span className="meal-type-name">{label}</span>
                      <div className="meal-bar-track"><i className={tone} style={{ width: `${percent}%` }} /></div>
                      <b>{count}<small> meals</small></b>
                    </div>
                  ))}
                </div>
              </section>
              <section className="section-page-card section-preference-card">
                <span className="stat-icon violet"><Leaf size={19} /></span>
                <div><h2>Your food preferences</h2><p>Vegetarian · Shared with your hosts</p></div>
                <span className="section-preference-check"><Check size={15} /> Saved</span>
              </section>
            </div>
          )}

          {section === "recent-activity" && (
            <section className="section-page-card" aria-label="Recent activity">
              <div className="section-page-card-heading"><div><h2>Activity timeline</h2><p>Your latest booking and meal updates.</p></div></div>
              <div className="section-activity-list">
                {recentActivity.map(({ title, detail, time, Icon, tone }) => (
                  <article className="section-activity-row" key={title}>
                    <span className={`section-activity-icon ${tone}`}><Icon size={17} /></span>
                    <div><h3>{title}</h3><p>{detail}</p><small><Clock3 size={13} /> {time}</small></div>
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
