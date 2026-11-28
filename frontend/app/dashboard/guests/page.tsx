"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Save,
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

const countryCodes = [
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW",
].flatMap((codes) => codes.split(" "));

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = countryCodes
  .map((code) => ({ code, name: regionNames.of(code) || code }))
  .sort((left, right) => left.name.localeCompare(right.name));

type GuestProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  guestCount: number;
  childrenCount: number;
  countryCode: string;
  feedback: string;
};

type ProfileForm = {
  phone: string;
  guestCount: string;
  childrenCount: string;
  countryCode: string;
  feedback: string;
};

function countryFlag(countryCode: string) {
  if (!/^[A-Z]{2}$/.test(countryCode)) return "🌐";
  return Array.from(countryCode, (letter) =>
    String.fromCodePoint(letter.charCodeAt(0) + 127397),
  ).join("");
}

export default function GuestProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    phone: "",
    guestCount: "1",
    childrenCount: "0",
    countryCode: "",
    feedback: "",
  });
  const [isSriLankan, setIsSriLankan] = useState<boolean | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        const result: { user?: GuestProfile; error?: string } = await response.json();
        if (!response.ok || !result.user) {
          throw new Error(result.error || "Unable to load your guest profile.");
        }
        if (active) {
          const user = result.user;
          setProfile(user);
          setForm({
            phone: user.phone || "",
            guestCount: String(user.guestCount || 1),
            childrenCount: String(user.childrenCount || 0),
            countryCode: user.countryCode || "",
            feedback: user.feedback || "",
          });
          setIsSriLankan(user.countryCode ? user.countryCode === "LK" : null);
          setProfileSaved(Boolean(user.phone && user.countryCode));
        }
      } catch (error) {
        if (active) {
          setFormError(error instanceof Error ? error.message : "Unable to load your guest profile.");
        }
      } finally {
        if (active) setPageLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormMessage("");

    if (isSriLankan === null) {
      setFormError("Choose whether you are a Sri Lankan guest.");
      return;
    }
    if (!isSriLankan && !form.countryCode) {
      setFormError("Choose your country.");
      return;
    }
    if (Number(form.childrenCount) > Number(form.guestCount)) {
      setFormError("Child count cannot be more than the total guest count.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          guestCount: Number(form.guestCount),
          childrenCount: Number(form.childrenCount),
          countryCode: isSriLankan ? "LK" : form.countryCode,
          feedback: form.feedback,
        }),
      });
      const result: { user?: GuestProfile; error?: string } = await response.json();
      if (!response.ok || !result.user) {
        throw new Error(result.error || "Unable to save your guest profile.");
      }

      setProfile(result.user);
      setForm({
        phone: result.user.phone || "",
        guestCount: String(result.user.guestCount),
        childrenCount: String(result.user.childrenCount),
        countryCode: result.user.countryCode,
        feedback: result.user.feedback || "",
      });
      setIsSriLankan(result.user.countryCode === "LK");
      setProfileSaved(true);
      setFormMessage("Your guest profile has been saved.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save your guest profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setFormError("");
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
      setFormError(error instanceof Error ? error.message : "Unable to sign out.");
      setSigningOut(false);
    }
  }

  const initials = profile?.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "MP";

  return (
    <main className="guest-dashboard">
      {sidebarOpen && (
        <button className="dashboard-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />
      )}
      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/dashboard">
          <span className="dashboard-brand-icon" aria-hidden="true" />
          <span>Menu<span>Pilot</span><small>GUEST PORTAL</small></span>
        </Link>
        <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>

        <div className="guest-profile">
          <span className="guest-avatar">{initials}</span>
          <span><b>{profile?.name || (pageLoading ? "Loading..." : "Guest profile")}</b><small>{profile?.email || "Your account"}</small></span>
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
            <button className="dashboard-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <span>Workspace</span><ChevronRight size={15} /><b>Guest profile</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">Friday, 27 November 2026</span>
            <button className="dashboard-bell" aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="dashboard-account">
              <span className="top-avatar">{initials}</span>
              <span className="dashboard-account-info">
                <b>{profile?.name || (pageLoading ? "Loading..." : "Account unavailable")}</b>
                <small>{profile?.email || ""}</small>
              </span>
            </div>
          </div>
        </header>

        <div className="dashboard-content dashboard-section-content">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><i /> YOUR MENUPILOT ACCOUNT</div>
              <h1>Guest profile</h1>
              <p>Keep your contact and stay details up to date.</p>
            </div>
          </section>

          {formError && <p className="dashboard-auth-error" role="alert">{formError}</p>}

          <form className="guest-profile-form" onSubmit={handleSubmit}>
            <section className="guest-profile-card">
              <div className="guest-profile-card-heading">
                <div><h2>Account details</h2><p>Name and email are taken from your sign-up details.</p></div>
                <span className="guest-profile-badge">YOUR ACCOUNT</span>
              </div>
              <div className="guest-profile-grid">
                <label className="guest-profile-field">
                  Full name
                  <input value={profile?.name || ""} readOnly aria-readonly="true" placeholder="Loading your name..." />
                </label>
                <label className="guest-profile-field">
                  Email address
                  <input type="email" value={profile?.email || ""} readOnly aria-readonly="true" placeholder="Loading your email..." />
                </label>
                <label className="guest-profile-field">
                  Contact number
                  <input
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength={24}
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+94 77 123 4567"
                  />
                </label>
                <label className="guest-profile-field">
                  Number of guests
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    required
                    value={form.guestCount}
                    onChange={(event) => setForm((current) => ({ ...current, guestCount: event.target.value }))}
                  />
                </label>
                <label className="guest-profile-field">
                  Number of children
                  <input
                    type="number"
                    min="0"
                    max={form.guestCount || 1000}
                    step="1"
                    required
                    value={form.childrenCount}
                    onChange={(event) => setForm((current) => ({ ...current, childrenCount: event.target.value }))}
                  />
                </label>
              </div>
            </section>

            <section className="guest-profile-card">
              <div className="guest-profile-card-heading">
                <div><h2>Country details</h2><p>Choose your country so the hotel team can prepare for your stay.</p></div>
              </div>
              <fieldset className="guest-country-question">
                <legend>Are you a Sri Lankan guest?</legend>
                <label>
                  <input
                    type="radio"
                    name="isSriLankan"
                    required
                    checked={isSriLankan === true}
                    onChange={() => {
                      setIsSriLankan(true);
                      setForm((current) => ({ ...current, countryCode: "LK" }));
                    }}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="isSriLankan"
                    required
                    checked={isSriLankan === false}
                    onChange={() => {
                      setIsSriLankan(false);
                      setForm((current) => ({
                        ...current,
                        countryCode: current.countryCode === "LK" ? "" : current.countryCode,
                      }));
                    }}
                  />
                  No
                </label>
              </fieldset>

              {isSriLankan === true && (
                <div className="guest-selected-country" aria-label="Selected country: Sri Lanka">
                  <span>{countryFlag("LK")}</span><b>Sri Lanka</b><small>LK</small>
                </div>
              )}
              {isSriLankan === false && (
                <label className="guest-profile-field guest-country-select">
                  Select your country
                  <span className="guest-country-control">
                    <span className="guest-country-flag" aria-hidden="true">
                      {form.countryCode ? countryFlag(form.countryCode) : "🌐"}
                    </span>
                    <select
                      required
                      value={form.countryCode}
                      onChange={(event) => setForm((current) => ({ ...current, countryCode: event.target.value }))}
                    >
                      <option value="">Choose a country</option>
                      {countries.filter((country) => country.code !== "LK").map((country) => (
                        <option value={country.code} key={country.code}>
                          {countryFlag(country.code)} {country.name}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              )}
            </section>

            <section className="guest-profile-card">
              <div className="guest-profile-card-heading">
                <div><h2>Feedback</h2><p>Share feedback about MenuPilot and the hotel team.</p></div>
              </div>
              <label className="guest-profile-field guest-feedback-field">
                Your feedback <span>Optional</span>
                <textarea
                  rows={5}
                  maxLength={1000}
                  value={form.feedback}
                  onChange={(event) => setForm((current) => ({ ...current, feedback: event.target.value }))}
                  placeholder="Tell us what went well or how we can improve..."
                />
                <small>{form.feedback.length}/1,000 characters</small>
              </label>
            </section>

            {formMessage && <p className="guest-profile-success" role="status"><CheckCircle2 size={16} />{formMessage}</p>}
            <div className="guest-profile-actions">
              <span>Your profile details are only shared with your booking team.</span>
              <button type="submit" className="guest-profile-save" disabled={saving || pageLoading}>
                <Save size={16} /> {saving ? "Saving..." : profileSaved ? "Update profile" : "Save profile"}
              </button>
            </div>
          </form>

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}
