"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  LogOut,
  Mail,
  Menu,
  Search,
  SlidersHorizontal,
  Utensils,
  Users,
  X,
} from "lucide-react";

type GuestStatus = "Confirmed" | "Pending" | "Checked out" | "Cancelled";

type Guest = {
  id: number;
  name: string;
  email: string;
  initials: string;
  booking: string;
  preference: string;
  status: GuestStatus;
  joined: string;
};

const initialGuests: Guest[] = [
  { id: 1, name: "Maya Perera", email: "maya.perera@email.com", initials: "MP", booking: "Villa Serene", preference: "Vegetarian", status: "Confirmed", joined: "Nov 14, 2026" },
  { id: 2, name: "Noah Williams", email: "noah.w@email.com", initials: "NW", booking: "Harbor House", preference: "No restrictions", status: "Confirmed", joined: "Nov 13, 2026" },
  { id: 3, name: "Asha Fernando", email: "asha.fernando@email.com", initials: "AF", booking: "Mountain Table", preference: "Vegan", status: "Pending", joined: "Nov 12, 2026" },
  { id: 4, name: "Liam Chen", email: "liam.chen@email.com", initials: "LC", booking: "Villa Serene", preference: "Gluten-free", status: "Confirmed", joined: "Nov 11, 2026" },
  { id: 5, name: "Sofia Patel", email: "sofia.patel@email.com", initials: "SP", booking: "Golden Palm", preference: "No restrictions", status: "Checked out", joined: "Nov 10, 2026" },
  { id: 6, name: "Ravi Jayasinghe", email: "ravi.j@email.com", initials: "RJ", booking: "Garden dinner", preference: "Vegetarian", status: "Pending", joined: "Nov 09, 2026" },
  { id: 7, name: "Emma Johnson", email: "emma.j@email.com", initials: "EJ", booking: "Harbor House", preference: "Dairy-free", status: "Confirmed", joined: "Nov 08, 2026" },
  { id: 8, name: "Daniel Kim", email: "daniel.kim@email.com", initials: "DK", booking: "Mountain Table", preference: "No restrictions", status: "Cancelled", joined: "Nov 07, 2026" },
  { id: 9, name: "Nisha Silva", email: "nisha.silva@email.com", initials: "NS", booking: "Golden Palm", preference: "Vegan", status: "Confirmed", joined: "Nov 06, 2026" },
  { id: 10, name: "Oliver Brown", email: "oliver.b@email.com", initials: "OB", booking: "Villa Serene", preference: "No restrictions", status: "Pending", joined: "Nov 05, 2026" },
];

const preferences = ["No restrictions", "Vegetarian", "Vegan", "Gluten-free", "Dairy-free"];
const pageSize = 5;

const dashboardLinks = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guests", href: "/dashboard/guests", Icon: Users },
  { label: "Bookings", href: "/dashboard#upcoming", Icon: CalendarDays },
  { label: "Meal planner", href: "/dashboard#meal-plan", Icon: Utensils },
  { label: "Recent activity", href: "/dashboard#activity", Icon: ClipboardList },
];

export default function GuestManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guests, setGuests] = useState(initialGuests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [preferenceFilter, setPreferenceFilter] = useState("All preferences");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guests.filter((guest) => {
      const matchesSearch = !query || [guest.name, guest.email, guest.booking].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All statuses" || guest.status === statusFilter;
      const matchesPreference = preferenceFilter === "All preferences" || guest.preference === preferenceFilter;
      return matchesSearch && matchesStatus && matchesPreference;
    });
  }, [guests, preferenceFilter, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const pageGuests = filteredGuests.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = filteredGuests.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(currentPage * pageSize, filteredGuests.length);
  const confirmedCount = guests.filter((guest) => guest.status === "Confirmed").length;
  const pendingCount = guests.filter((guest) => guest.status === "Pending").length;
  const preferenceCount = guests.filter((guest) => guest.preference !== "No restrictions").length;

  const closeModal = () => setSelectedGuest(null);

  return (
    <main className="guest-dashboard" id="guest-management">
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
            <Link
              key={label}
              className={label === "Guests" ? "active" : ""}
              href={href}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Guests" && <span className="nav-count">{guests.length}</span>}
            </Link>
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
            <button className="dashboard-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <span>Workspace</span><ChevronRight size={15} /><b>Guest management</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">Friday, 27 November 2026</span>
            <button className="dashboard-bell" aria-label="Notifications"><Bell size={19} /><i /></button>
            <span className="top-avatar">AM</span>
          </div>
        </header>

        <div className="dashboard-content guest-management-content">
          <section className="dashboard-welcome guest-management-heading">
            <div>
              <div className="dashboard-eyebrow"><i /> PEOPLE & BOOKINGS</div>
              <h1>Guest management</h1>
              <p>Keep guest details, bookings, and preferences all in one place.</p>
            </div>
            <Link className="dashboard-plan-link add-guest-button" href="/dashboard/guests/new">
              <Users size={16} /> Add guest
            </Link>
          </section>

          <section className="guest-management-stats" aria-label="Guest summary">
            <article><span className="guest-stat-icon blue"><Users size={17} /></span><span className="guest-stat-label">Total guests</span><b>{guests.length.toString().padStart(2, "0")}</b><small>Across all bookings</small></article>
            <article><span className="guest-stat-icon green"><Check size={17} /></span><span className="guest-stat-label">Confirmed</span><b>{confirmedCount.toString().padStart(2, "0")}</b><small>Ready for their stay</small></article>
            <article><span className="guest-stat-icon gold"><CalendarDays size={17} /></span><span className="guest-stat-label">Pending</span><b>{pendingCount.toString().padStart(2, "0")}</b><small>Awaiting confirmation</small></article>
            <article><span className="guest-stat-icon violet"><Leaf size={17} /></span><span className="guest-stat-label">Dietary preferences</span><b>{preferenceCount.toString().padStart(2, "0")}</b><small>Preferences on file</small></article>
          </section>

          <section className="guest-list-card">
            <div className="guest-list-heading">
              <div><h2>All guests <span>{filteredGuests.length}</span></h2><p>Search and manage the people connected to your bookings.</p></div>
              <div className="guest-list-tools-label"><SlidersHorizontal size={15} /> List controls</div>
            </div>

            <div className="guest-list-controls">
              <label className="guest-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search name, email or booking..."
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                  aria-label="Search guests"
                />
              </label>
              <label className="guest-filter">
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}>
                  <option>All statuses</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Checked out</option>
                  <option>Cancelled</option>
                </select>
              </label>
              <label className="guest-filter preference-filter">
                <span>Dietary needs</span>
                <select value={preferenceFilter} onChange={(event) => { setPreferenceFilter(event.target.value); setCurrentPage(1); }}>
                  <option>All preferences</option>
                  {preferences.map((preference) => <option key={preference}>{preference}</option>)}
                </select>
              </label>
            </div>

            <div className="guest-table-wrap">
              <table className="guest-table">
                <thead>
                  <tr><th>GUEST</th><th>BOOKING</th><th>DIETARY NEEDS</th><th>STATUS</th><th>ADDED</th><th><span className="visually-hidden">Actions</span></th></tr>
                </thead>
                <tbody>
                  {pageGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td className="guest-person-cell" data-label="Guest">
                        <span className={`guest-list-avatar avatar-${guest.id % 5}`}>{guest.initials}</span>
                        <span className="guest-person-copy"><b>{guest.name}</b><small>{guest.email}</small></span>
                      </td>
                      <td data-label="Booking"><span className="guest-booking-name">{guest.booking}</span></td>
                      <td data-label="Dietary needs"><span className="guest-preference"><Leaf size={13} />{guest.preference}</span></td>
                      <td data-label="Status"><span className={`guest-status status-${guest.status.toLowerCase().replace(/\s+/g, "-")}`}>{guest.status}</span></td>
                      <td data-label="Added"><span className="guest-added-date">{guest.joined}</span></td>
                      <td className="guest-row-actions" data-label="Actions">
                        <button className="guest-row-action" onClick={() => setSelectedGuest(guest)} aria-label={`View ${guest.name}`} title="View guest"><Users size={15} /></button>
                        <a className="guest-row-action" href={`mailto:${guest.email}`} aria-label={`Email ${guest.name}`} title="Email guest"><Mail size={15} /></a>
                      </td>
                    </tr>
                  ))}
                  {pageGuests.length === 0 && (
                    <tr><td className="guest-empty-cell" colSpan={6}><span><Search size={19} /></span><b>No guests found</b><small>Try another search or clear your filters.</small><button onClick={() => { setSearch(""); setStatusFilter("All statuses"); setPreferenceFilter("All preferences"); setCurrentPage(1); }}>Clear filters</button></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="guest-pagination">
              <span>Showing <b>{firstItem}–{lastItem}</b> of <b>{filteredGuests.length}</b> guests</span>
              <div className="guest-pagination-controls">
                <button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><ChevronLeft size={16} /></button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                  <button key={page} className={page === currentPage ? "current" : ""} aria-label={`Page ${page}`} aria-current={page === currentPage ? "page" : undefined} onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
                <button aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}><ChevronRight size={16} /></button>
              </div>
            </div>
          </section>

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Guest details stay organised <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>

      {selectedGuest && (
        <div className="guest-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section className="guest-modal" role="dialog" aria-modal="true" aria-labelledby="guest-details-title">
            <button className="guest-modal-close" onClick={closeModal} aria-label="Close guest details"><X size={18} /></button>
            <span className="guest-modal-avatar">{selectedGuest.initials}</span>
            <div className="dashboard-eyebrow"><i /> GUEST PROFILE</div>
            <h2 id="guest-details-title">{selectedGuest.name}</h2>
            <a className="guest-modal-email" href={`mailto:${selectedGuest.email}`}><Mail size={15} />{selectedGuest.email}</a>
            <div className="guest-modal-details">
              <div><small>Booking</small><b>{selectedGuest.booking}</b></div>
              <div><small>Dietary needs</small><b>{selectedGuest.preference}</b></div>
              <div><small>Status</small><b>{selectedGuest.status}</b></div>
              <div><small>Added</small><b>{selectedGuest.joined}</b></div>
            </div>
            <a className="guest-modal-primary" href={`mailto:${selectedGuest.email}`}>Email guest <ArrowUpRight size={16} /></a>
          </section>
        </div>
      )}

    </main>
  );
}
