"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Soup,
  Sun,
  Utensils,
  Users,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guests", href: "/dashboard/guests", Icon: Users },
  { label: "My bookings", href: "/dashboard/bookings", Icon: CalendarDays },
  { label: "Recent activity", href: "/dashboard/recent-activity", Icon: ClipboardList },
];

const mealTypes = [
  { label: "Breakfast", count: 8, percent: 80, Icon: Coffee, tone: "blue" },
  { label: "Lunch", count: 6, percent: 60, Icon: Soup, tone: "green" },
  { label: "Dinner", count: 4, percent: 40, Icon: Utensils, tone: "gold" },
];

const mealOptions = ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"];

type GuestDateForm = {
  guestCount: string;
  childCount: string;
  driverCount: string;
  guideCount: string;
};

const initialGuestDateForm: GuestDateForm = {
  guestCount: "1",
  childCount: "0",
  driverCount: "",
  guideCount: "",
};

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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerStep, setPlannerStep] = useState<"guest-details" | "meals" | "complete">("guest-details");
  const [guestDateForm, setGuestDateForm] = useState(initialGuestDateForm);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [otherMealName, setOtherMealName] = useState("");
  const [plannerError, setPlannerError] = useState("");

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

  function openPlannerForDate(date: Date) {
    setSelectedDate(date);
    setGuestDateForm(initialGuestDateForm);
    setSelectedMeals([]);
    setOtherMealName("");
    setPlannerError("");
    setPlannerStep("guest-details");
    setPlannerOpen(true);
  }

  function handleGuestDetailsNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlannerError("");

    if (Number(guestDateForm.childCount) > Number(guestDateForm.guestCount)) {
      setPlannerError("Children cannot be more than the total number of guests.");
      return;
    }

    setPlannerStep("meals");
  }

  function toggleMealOption(option: string) {
    setSelectedMeals((current) =>
      current.includes(option)
        ? current.filter((meal) => meal !== option)
        : [...current, option],
    );
    setPlannerError("");
    if (option === "Other" && selectedMeals.includes("Other")) {
      setOtherMealName("");
    }
  }

  function handleMealSelectionNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlannerError("");

    if (selectedMeals.length === 0) {
      setPlannerError("Select at least one meal type to continue.");
      return;
    }

    if (selectedMeals.includes("Other") && !otherMealName.trim()) {
      setPlannerError("Enter a name for the other meal or event.");
      return;
    }

    setPlannerStep("complete");
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
  const firstDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = new Date();
  const sameDate = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

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
            <Link className="dashboard-plan-link" href="#meal-planner">
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

          <section className="overview-planner-section" id="meal-planner">
            <div className="overview-planner-title">
              <div className="dashboard-eyebrow"><i /> MENUS & PREFERENCES</div>
              <h2>Meal planner</h2>
            </div>
            <section className="overview-calendar-section" aria-label="Meal planner calendar">
              <div className="overview-calendar-card">
                <div className="overview-calendar-heading">
                  <div>
                    <div className="dashboard-eyebrow"><i /> YOUR CALENDAR</div>
                    <h2>Select a date</h2>
                  </div>
                  <CalendarDays size={20} aria-hidden="true" />
                </div>
                <div className="overview-calendar-month">
                  <b>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth)}</b>
                  <div>
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
                <div className="overview-calendar-grid" role="group" aria-label="Choose a date">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <span className="overview-calendar-weekday" key={day}>{day}</span>
                  ))}
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <span className="overview-calendar-empty" key={`empty-${index}`} aria-hidden="true" />;
                    }

                    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
                    const isSelected = sameDate(date, selectedDate);
                    const isToday = sameDate(date, today);
                    return (
                      <button
                        className={`overview-calendar-day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                        key={day}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(date)}
                        onClick={() => openPlannerForDate(date)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="overview-calendar-selected">
                  Selected date <b>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(selectedDate)}</b>
                </p>
              </div>
            </section>
            <div className="section-page-grid overview-meal-content">
              <section className="section-page-card">
                <div className="section-page-card-heading">
                  <div><h2>Meal selections</h2><p>Review meals for your selected date.</p></div>
                  <span className="booking-total">18 of 24 selected</span>
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
              </section>
              <section className="section-page-card section-preference-card">
                <span className="overview-preference-icon"><Leaf size={19} /></span>
                <div><h2>Your food preferences</h2><p>Vegetarian · Shared with your hosts</p></div>
                <span className="section-preference-check"><Check size={15} /> Saved</span>
              </section>
            </div>
          </section>

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>

      {plannerOpen && (
        <div
          className="planner-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlannerOpen(false);
          }}
        >
          <aside className="planner-drawer" role="dialog" aria-modal="true" aria-labelledby="planner-drawer-title">
            <header className="planner-drawer-header">
              <div>
                <span className="planner-drawer-date">
                  {new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(selectedDate)}
                </span>
                <h2 id="planner-drawer-title">
                  {plannerStep === "complete" ? "Meal plan submitted" : "Plan your day"}
                </h2>
              </div>
              <button type="button" className="planner-drawer-close" onClick={() => setPlannerOpen(false)} aria-label="Close meal planner">
                <X size={19} />
              </button>
            </header>

            {plannerStep === "guest-details" && (
              <form className="planner-drawer-form" onSubmit={handleGuestDetailsNext}>
                <div className="planner-step-heading">
                  <span>STEP 1 OF 2</span>
                  <h3>Who is joining you?</h3>
                  <p>Tell us how many people will be there on this date.</p>
                </div>
                <div className="planner-form-grid">
                  <label>
                    Number of guests
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={guestDateForm.guestCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, guestCount: event.target.value }))}
                    />
                  </label>
                  <label>
                    Children
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={guestDateForm.childCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, childCount: event.target.value }))}
                    />
                  </label>
                  <label>
                    Drivers <span className="planner-optional">Optional</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Number of drivers"
                      value={guestDateForm.driverCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, driverCount: event.target.value }))}
                    />
                  </label>
                  <label>
                    Guides <span className="planner-optional">Optional</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Number of guides"
                      value={guestDateForm.guideCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, guideCount: event.target.value }))}
                    />
                  </label>
                </div>
                {plannerError && <p className="planner-form-error" role="alert">{plannerError}</p>}
                <div className="planner-drawer-actions">
                  <button type="button" className="planner-secondary-button" onClick={() => setPlannerOpen(false)}>Cancel</button>
                  <button type="submit" className="planner-primary-button">Next <ChevronRight size={16} /></button>
                </div>
              </form>
            )}

            {plannerStep === "meals" && (
              <form className="planner-drawer-form" onSubmit={handleMealSelectionNext}>
                <div className="planner-step-heading">
                  <span>STEP 2 OF 2</span>
                  <h3>Which meals should we plan?</h3>
                  <p>Select the meal types you need for this date.</p>
                </div>
                <div className="planner-meal-options">
                  {mealOptions.map((option) => (
                    <label className={`planner-meal-option${selectedMeals.includes(option) ? " is-selected" : ""}`} key={option}>
                      <input
                        type="checkbox"
                        checked={selectedMeals.includes(option)}
                        onChange={() => toggleMealOption(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {selectedMeals.includes("Other") && (
                  <label className="planner-other-meal">
                    Other meal or event name
                    <input
                      type="text"
                      autoFocus
                      required
                      value={otherMealName}
                      onChange={(event) => setOtherMealName(event.target.value)}
                      placeholder="e.g. Birthday dinner"
                    />
                  </label>
                )}
                {plannerError && <p className="planner-form-error" role="alert">{plannerError}</p>}
                <div className="planner-drawer-actions">
                  <button type="button" className="planner-secondary-button" onClick={() => setPlannerOpen(false)}>Cancel</button>
                  <button type="button" className="planner-back-button" onClick={() => { setPlannerError(""); setPlannerStep("guest-details"); }}>Back</button>
                  <button type="submit" className="planner-primary-button">Next <ChevronRight size={16} /></button>
                </div>
              </form>
            )}

            {plannerStep === "complete" && (
              <div className="planner-complete">
                <span className="planner-complete-icon"><CheckCircle2 size={26} /></span>
                <h3>Your plan is ready</h3>
                <p>Selections for {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(selectedDate)}</p>
                <div className="planner-complete-summary">
                  <span><b>Guests</b>{guestDateForm.guestCount} total · {guestDateForm.childCount} children</span>
                  <span><b>Drivers</b>{guestDateForm.driverCount || "0"}</span>
                  <span><b>Guides</b>{guestDateForm.guideCount || "0"}</span>
                  <span><b>Meals</b>{selectedMeals.map((meal) => meal === "Other" ? otherMealName.trim() : meal).join(", ")}</span>
                </div>
                <p className="planner-demo-note">This demo form does not save details to a server.</p>
                <button type="button" className="planner-primary-button planner-done-button" onClick={() => setPlannerOpen(false)}>Done</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
