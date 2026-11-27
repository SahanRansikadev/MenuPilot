"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
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
  Plus,
  Soup,
  Sun,
  Utensils,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "#overview", Icon: LayoutDashboard },
  { label: "My bookings", href: "#upcoming", Icon: CalendarDays },
  { label: "Meal planner", href: "#meal-plan", Icon: Utensils },
  { label: "Recent activity", href: "#activity", Icon: ClipboardList },
];

const bookings = [
  {
    title: "Weekend at Villa Serene",
    detail: "Breakfast & dinner · 2 guests",
    date: "5–7 Dec, 2026",
    status: "Confirmed",
    Icon: Coffee,
    tone: "blue",
  },
  {
    title: "Garden dinner",
    detail: "Private event · 6 guests",
    date: "19 Dec, 2026",
    status: "Awaiting menu",
    Icon: PartyPopper,
    tone: "gold",
  },
];

const mealTypes = [
  { label: "Breakfast", count: 8, percent: 80, Icon: Coffee, tone: "blue" },
  { label: "Lunch", count: 6, percent: 60, Icon: Soup, tone: "green" },
  { label: "Dinner", count: 4, percent: 40, Icon: Utensils, tone: "gold" },
];

export default function GuestDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <span className="guest-avatar">AM</span>
          <span><b>Alex Morgan</b><small>Guest account</small></span>
          <ChevronDown size={15} />
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="dashboard-nav" aria-label="Guest dashboard">
          {navigation.map(({ label, href, Icon }, index) => (
            <a
              key={label}
              className={index === 0 ? "active" : ""}
              href={href}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "My bookings" && <span className="nav-count">2</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div><b>Need a hand?</b><small>Our team is here to help.</small></div>
            <a href="/#contact" aria-label="Contact support"><ArrowUpRight size={16} /></a>
          </div>
          <Link className="sidebar-logout" href="/">
            <LogOut size={17} /> Back to MenuPilot
          </Link>
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
            <span className="top-avatar">AM</span>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><i /> YOUR MENUPILOT SPACE</div>
              <h1>Good morning, Alex <Sun size={19} className="welcome-sun" /></h1>
              <p>Here’s what’s happening with your stays and menus.</p>
            </div>
            <a className="dashboard-plan-link" href="#meal-plan">
              <Utensils size={17} /> Plan a meal <ArrowUpRight size={15} />
            </a>
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

          <section className="dashboard-panels">
            <article className="dashboard-card selection-chart" id="activity">
              <div className="dashboard-card-heading">
                <div><h2>Meal selections</h2><p>Your choices over the last 7 days</p></div>
                <span className="chart-range">This week <ChevronDown size={14} /></span>
              </div>
              <div className="chart-legend"><span><i /> Meals selected</span><b>18 <small>total</small></b></div>
              <div className="selection-chart-plot">
                <div className="chart-y-labels"><span>12</span><span>8</span><span>4</span><span>0</span></div>
                <svg viewBox="0 0 640 190" preserveAspectRatio="none" role="img" aria-label="Meal selections chart: selections increased from Monday through Sunday">
                  <defs>
                    <linearGradient id="selectionFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2864df" stopOpacity=".18" />
                      <stop offset="100%" stopColor="#2864df" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="chart-area" d="M0 148 C38 144 54 115 106 120 S164 137 213 99 S270 110 320 88 S379 99 426 65 S483 83 533 54 S592 64 640 25 L640 190 L0 190 Z" />
                  <path className="chart-line" d="M0 148 C38 144 54 115 106 120 S164 137 213 99 S270 110 320 88 S379 99 426 65 S483 83 533 54 S592 64 640 25" />
                  <circle cx="106" cy="120" r="4" /><circle cx="213" cy="99" r="4" /><circle cx="320" cy="88" r="4" /><circle cx="426" cy="65" r="4" /><circle cx="533" cy="54" r="4" /><circle cx="640" cy="25" r="4" />
                </svg>
                <div className="chart-grid"><i /><i /><i /><i /></div>
              </div>
              <div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
            </article>

            <article className="dashboard-card next-booking" id="upcoming">
              <div className="dashboard-card-heading">
                <div><h2>Next stay</h2><p>Your upcoming booking</p></div>
                <button aria-label="More booking options" className="more-button">···</button>
              </div>
              <div className="booking-date-block"><b>05</b><span>DEC<br />2026</span></div>
              <h3>Weekend at Villa Serene</h3>
              <div className="booking-location"><MapPin size={15} /> Galle, Sri Lanka</div>
              <div className="booking-divider" />
              <div className="booking-detail-row"><span>Guests</span><b>2 people</b></div>
              <div className="booking-detail-row"><span>Meal plan</span><b>Breakfast & dinner</b></div>
              <a className="booking-open" href="#upcoming">View booking details <ArrowUpRight size={15} /></a>
            </article>
          </section>

          <section className="dashboard-bottom-panels">
            <article className="dashboard-card meal-summary" id="meal-plan">
              <div className="dashboard-card-heading">
                <div><h2>Your meal plan</h2><p>Selections for all upcoming bookings</p></div>
                <a className="view-all-link" href="#upcoming">View all <ChevronRight size={15} /></a>
              </div>
              <div className="meal-bars">
                {mealTypes.map(({ label, count, percent, Icon, tone }) => (
                  <div className="meal-bar-row" key={label}>
                    <span className={`meal-type-icon ${tone}`}><Icon size={17} /></span>
                    <span className="meal-type-name">{label}</span>
                    <div className="meal-bar-track"><i className={tone} style={{ width: `${percent}%` }} /></div>
                    <b>{count}<small> meals</small></b>
                  </div>
                ))}
              </div>
              <a className="meal-plan-action" href="#upcoming"><span><Plus size={16} /></span>Review your meal choices <ArrowUpRight size={15} /></a>
            </article>

            <article className="dashboard-card recent-bookings">
              <div className="dashboard-card-heading">
                <div><h2>Recent bookings</h2><p>Keep track of your plans</p></div>
                <span className="booking-total">2 bookings</span>
              </div>
              <div className="recent-booking-list">
                {bookings.map(({ title, detail, date, status, Icon, tone }) => (
                  <div className="recent-booking" key={title}>
                    <span className={`recent-booking-icon ${tone}`}><Icon size={18} /></span>
                    <div className="recent-booking-info"><b>{title}</b><span>{detail}</span><small><Clock3 size={12} /> {date}</small></div>
                    <span className={`booking-status ${status==="Confirmed"?"confirmed":"pending"}`}>{status}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}
