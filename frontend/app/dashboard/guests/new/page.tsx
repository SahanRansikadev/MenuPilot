"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
  Soup,
  Utensils,
  Users,
  X,
} from "lucide-react";

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  partySize: string;
  property: string;
  arrival: string;
  departure: string;
  occasion: string;
  meals: string[];
  dietaryNeeds: string;
  notes: string;
};

const initialForm: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  partySize: "2",
  property: "",
  arrival: "",
  departure: "",
  occasion: "",
  meals: [],
  dietaryNeeds: "No restrictions",
  notes: "",
};

const steps = [
  { label: "Guest details", description: "Who is staying?", Icon: Users },
  { label: "Booking", description: "When and where?", Icon: CalendarDays },
  { label: "Meals", description: "Food preferences", Icon: Utensils },
  { label: "Review", description: "Check your details", Icon: ClipboardList },
];

const meals = [
  { label: "Breakfast", description: "Start the day", Icon: Coffee },
  { label: "Lunch", description: "A midday meal", Icon: Soup },
  { label: "Dinner", description: "An evening meal", Icon: Utensils },
  { label: "Afternoon tea", description: "A little refreshment", Icon: PartyPopper },
];

const dashboardLinks = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guests", href: "/dashboard/guests", Icon: Users },
  { label: "Bookings", href: "/dashboard#upcoming", Icon: CalendarDays },
  { label: "Meal planner", href: "/dashboard#meal-plan", Icon: Utensils },
  { label: "Recent activity", href: "/dashboard#activity", Icon: ClipboardList },
];

function formatDate(value: string) {
  if (!value) return "Choose a date";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

export default function NewGuestBookingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [stepError, setStepError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateForm = (field: keyof Omit<FormValues, "meals">, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setStepError("");
  };

  const toggleMeal = (meal: string) => {
    setForm((current) => ({
      ...current,
      meals: current.meals.includes(meal)
        ? current.meals.filter((selected) => selected !== meal)
        : [...current.meals, meal],
    }));
    setStepError("");
  };

  const handleStepSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStepError("");

    if (step === 1) {
      const today = new Date().toISOString().slice(0, 10);
      if (form.arrival < today) {
        setStepError("Check-in date must be today or later.");
        return;
      }
      if (form.departure <= form.arrival) {
        setStepError("Check-out must be after check-in.");
        return;
      }
    }

    if (step === 2 && form.meals.length === 0) {
      setStepError("Select at least one meal to continue.");
      return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    setSubmitted(true);
  };

  const restartForm = () => {
    setForm(initialForm);
    setStep(0);
    setStepError("");
    setSubmitted(false);
  };

  return (
    <main className="guest-dashboard" id="new-guest-booking">
      {sidebarOpen && <button className="dashboard-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/dashboard">
          <span className="dashboard-brand-icon"><Utensils size={20} /></span>
          <span>Menu<span>Pilot</span><small>GUEST PORTAL</small></span>
        </Link>
        <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>

        <div className="guest-profile">
          <span className="guest-avatar">AM</span>
          <span><b>Alex Morgan</b><small>Workspace manager</small></span>
          <ChevronDown size={15} />
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {dashboardLinks.map(({ label, href, Icon }) => (
            <Link key={label} className={label === "Guests" ? "active" : ""} href={href} onClick={() => setSidebarOpen(false)}>
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
          <Link className="sidebar-logout" href="/"><LogOut size={17} /> Back to MenuPilot</Link>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <button className="dashboard-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <span>Workspace</span><ChevronRight size={15} /><Link href="/dashboard/guests">Guests</Link><ChevronRight size={15} /><b>{submitted ? "Complete" : "New booking"}</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">Friday, 27 November 2026</span>
            <button className="dashboard-bell" aria-label="Notifications"><Bell size={19} /><i /></button>
            <span className="top-avatar">AM</span>
          </div>
        </header>

        <div className="dashboard-content booking-create-content">
          {submitted ? (
            <section className="booking-complete-card" aria-labelledby="booking-complete-title">
              <span className="booking-complete-icon"><Check size={27} /></span>
              <div className="dashboard-eyebrow"><i /> ALL SET</div>
              <h1 id="booking-complete-title">Guest & booking details are ready</h1>
              <p>This demo form has been completed for <b>{form.fullName}</b>. Connect it to your backend to save the guest and booking.</p>
              <div className="booking-complete-summary">
                <span><CalendarDays size={16} /> {formatDate(form.arrival)} – {formatDate(form.departure)}</span>
                <span><MapPin size={16} /> {form.property}</span>
                <span><Utensils size={16} /> {form.meals.join(", ")}</span>
              </div>
              <div className="booking-complete-actions">
                <Link className="booking-primary-button" href="/dashboard/guests">Back to guest list <ArrowRight size={16} /></Link>
                <button className="booking-secondary-button" onClick={restartForm}>Create another booking</button>
              </div>
            </section>
          ) : (
            <>
              <section className="dashboard-welcome booking-form-heading">
                <div>
                  <div className="dashboard-eyebrow"><i /> GUEST DIRECTORY</div>
                  <h1>Add guest & booking</h1>
                  <p>Collect guest details, stay information, and meal preferences in one flow.</p>
                </div>
                <Link className="booking-cancel-link" href="/dashboard/guests"><ArrowLeft size={15} /> Back to guests</Link>
              </section>

              <div className="booking-stepper" aria-label="Booking creation steps">
                <div className="booking-stepper-track"><span style={{ width: `${(step / (steps.length - 1)) * 100}%` }} /></div>
                {steps.map(({ label, description, Icon }, index) => (
                  <button
                    className={`booking-step${index === step ? " active" : ""}${index < step ? " complete" : ""}`}
                    key={label}
                    type="button"
                    disabled={index > step}
                    onClick={() => { setStep(index); setStepError(""); }}
                    aria-current={index === step ? "step" : undefined}
                  >
                    <span className="booking-step-icon">{index < step ? <Check size={16} /> : <Icon size={16} />}</span>
                    <span className="booking-step-copy"><b>{label}</b><small>{description}</small></span>
                  </button>
                ))}
              </div>

              <div className="booking-form-layout">
                <form className="booking-step-card" onSubmit={handleStepSubmit}>
                  {step === 0 && (
                    <>
                      <div className="booking-step-heading"><span className="booking-step-kicker">STEP 01 · GUEST</span><h2>Who is joining you?</h2><p>Start with the main guest’s contact details.</p></div>
                      <div className="booking-fields-grid">
                        <label className="booking-field full-field">Full name<input autoComplete="name" value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} placeholder="e.g. Alex Morgan" required /></label>
                        <label className="booking-field">Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="alex@example.com" required /></label>
                        <label className="booking-field">Phone number <span>Optional</span><input type="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="+94 77 123 4567" /></label>
                        <label className="booking-field full-field">Number of guests<select value={form.partySize} onChange={(event) => updateForm("partySize", event.target.value)}>{Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>)}</select></label>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div className="booking-step-heading"><span className="booking-step-kicker">STEP 02 · BOOKING</span><h2>Plan the stay</h2><p>Choose where and when the guest will be staying.</p></div>
                      <div className="booking-fields-grid">
                        <label className="booking-field full-field">Property or venue<select value={form.property} onChange={(event) => updateForm("property", event.target.value)} required><option value="">Select a property</option><option>Villa Serene</option><option>Harbor House</option><option>Golden Palm</option><option>Mountain Table</option></select></label>
                        <label className="booking-field">Check-in<input type="date" value={form.arrival} min={new Date().toISOString().slice(0, 10)} onChange={(event) => updateForm("arrival", event.target.value)} required /></label>
                        <label className="booking-field">Check-out<input type="date" value={form.departure} min={form.arrival || new Date().toISOString().slice(0, 10)} onChange={(event) => updateForm("departure", event.target.value)} required /></label>
                        <label className="booking-field full-field">Occasion<select value={form.occasion} onChange={(event) => updateForm("occasion", event.target.value)} required><option value="">Select an occasion</option><option>Relaxing getaway</option><option>Family gathering</option><option>Birthday celebration</option><option>Business trip</option><option>Other</option></select></label>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="booking-step-heading"><span className="booking-step-kicker">STEP 03 · MEALS</span><h2>Make room for good food</h2><p>Select the meals you’d like us to plan for this booking.</p></div>
                      <div className="meal-choice-grid">
                        {meals.map(({ label, description, Icon }) => {
                          const checked = form.meals.includes(label);
                          return (
                            <label className={`meal-choice${checked ? " selected" : ""}`} key={label}>
                              <input type="checkbox" checked={checked} onChange={() => toggleMeal(label)} />
                              <span className="meal-choice-icon"><Icon size={18} /></span>
                              <span className="meal-choice-copy"><b>{label}</b><small>{description}</small></span>
                              <span className="meal-choice-check">{checked && <Check size={13} />}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="booking-fields-grid meal-preference-fields">
                        <label className="booking-field full-field">Dietary preference<select value={form.dietaryNeeds} onChange={(event) => updateForm("dietaryNeeds", event.target.value)}><option>No restrictions</option><option>Vegetarian</option><option>Vegan</option><option>Gluten-free</option><option>Dairy-free</option><option>Other / multiple needs</option></select></label>
                        <label className="booking-field full-field">Allergies or meal notes <span>Optional</span><textarea rows={3} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Share any allergies, ingredients to avoid, or special requests." /></label>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="booking-step-heading"><span className="booking-step-kicker">STEP 04 · REVIEW</span><h2>Review the details</h2><p>Make sure everything looks right before completing this demo form.</p></div>
                      <div className="booking-review-section">
                        <div className="booking-review-heading"><span><Users size={16} /> Guest details</span><button type="button" onClick={() => setStep(0)}>Edit</button></div>
                        <div className="booking-review-grid"><div><small>Full name</small><b>{form.fullName}</b></div><div><small>Email</small><b>{form.email}</b></div><div><small>Phone</small><b>{form.phone || "Not provided"}</b></div><div><small>Guests</small><b>{form.partySize}</b></div></div>
                      </div>
                      <div className="booking-review-section">
                        <div className="booking-review-heading"><span><CalendarDays size={16} /> Booking details</span><button type="button" onClick={() => setStep(1)}>Edit</button></div>
                        <div className="booking-review-grid"><div><small>Property</small><b>{form.property}</b></div><div><small>Occasion</small><b>{form.occasion}</b></div><div><small>Check-in</small><b>{formatDate(form.arrival)}</b></div><div><small>Check-out</small><b>{formatDate(form.departure)}</b></div></div>
                      </div>
                      <div className="booking-review-section">
                        <div className="booking-review-heading"><span><Utensils size={16} /> Meal preferences</span><button type="button" onClick={() => setStep(2)}>Edit</button></div>
                        <div className="booking-review-meals">{form.meals.map((meal) => <span key={meal}><Check size={13} />{meal}</span>)}</div>
                        <p className="booking-review-diet"><Leaf size={14} /> {form.dietaryNeeds}{form.notes ? ` · ${form.notes}` : ""}</p>
                      </div>
                    </>
                  )}

                  {stepError && <p className="booking-step-error" role="alert">{stepError}</p>}
                  <div className="booking-step-actions">
                    {step > 0 ? <button className="booking-secondary-button" type="button" onClick={() => { setStep(step - 1); setStepError(""); }}><ArrowLeft size={15} /> Back</button> : <Link className="booking-secondary-button" href="/dashboard/guests">Cancel</Link>}
                    <button className="booking-primary-button" type="submit">{step === steps.length - 1 ? "Complete booking" : "Continue"}<ArrowRight size={16} /></button>
                  </div>
                  <small className="booking-demo-note">Demo form · Details are not sent or saved to a backend.</small>
                </form>

                <aside className="booking-summary-card">
                  <div className="booking-summary-top"><span><ClipboardList size={17} /></span><small>BOOKING SUMMARY</small></div>
                  <h2>{form.property || "Your new stay"}</h2>
                  <p>{form.occasion || "Choose an occasion to get started"}</p>
                  <div className="booking-summary-divider" />
                  <div className="booking-summary-row"><Users size={15} /><span>{form.fullName || "Guest name"}</span><b>{form.partySize}</b></div>
                  <div className="booking-summary-row"><CalendarDays size={15} /><span>{form.arrival ? formatDate(form.arrival) : "Check-in date"}</span></div>
                  <div className="booking-summary-row"><Clock3 size={15} /><span>{form.departure ? formatDate(form.departure) : "Check-out date"}</span></div>
                  <div className="booking-summary-divider" />
                  <div className="booking-summary-meals-title"><Utensils size={15} /> MEALS SELECTED <b>{form.meals.length}</b></div>
                  <div className="booking-summary-meal-list">{form.meals.length ? form.meals.map((meal) => <span key={meal}>{meal}</span>) : <small>Your selected meals will show here.</small>}</div>
                  <div className="booking-summary-tip"><Leaf size={15} /><span><b>Dietary needs</b><small>{form.dietaryNeeds}</small></span></div>
                  <Link className="booking-summary-help" href="/#contact">Need help planning? <ArrowUpRight size={14} /></Link>
                </aside>
              </div>
            </>
          )}

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Thoughtful stays start here <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}
