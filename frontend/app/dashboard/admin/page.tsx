"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Apple,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChefHat,
  ChevronRight,
  CircleHelp,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Pencil,
  Save,
  Send,
  Trash2,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";

type AdminRole = "admin" | "kitchenTeam" | "guest";
type AdminTab = "overview" | "users" | "bookings" | "menus" | "catalog" | "hotels" | "kitchen";
type MenuMealType = "Breakfast" | "Lunch" | "Tea time" | "Dinner" | "Barbecue" | "Other";
type BookingStatus = "pending" | "confirmed" | "preparing" | "completed" | "cancelled";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  phone: string;
  guestCount: number;
  childrenCount: number;
};

type AdminBooking = {
  id: string;
  guest: { id: string; name: string; email: string };
  date: string;
  status: BookingStatus;
  guestCount: number;
  childrenCount: number;
  driverCount: number;
  guideCount: number;
  meals: Array<{
    type: string;
    name?: string;
    time: string;
    foods: Array<{ name: string }>;
    ingredients: Array<{ name: string }>;
    hasIngredients: boolean;
  }>;
  isVegetarian: boolean;
  hasAllergies: boolean;
  allergyCount: number;
  notes: string;
};

type CatalogEntry = { id: string; name: string };
type HotelEntry = {
  id: string;
  name: string;
  location: string;
  description: string;
  contactName: string;
  phone: string;
  email: string;
};

type MenuEntry = {
  id: string;
  hotelName: string;
  name: string;
  mealType: MenuMealType;
  description: string;
  ingredients: string[];
  instructions: string;
};

type KitchenTask = {
  id: string;
  assignedTo: { id: string; name: string; email: string };
  booking: { id: string; date: string; guestCount: number };
  hotelName: string;
  recipeName: string;
  mealType: string;
  description: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  status: string;
};

type MenuForm = {
  hotelName: string;
  name: string;
  mealType: MenuMealType;
  description: string;
  ingredientsText: string;
  instructions: string;
};

const mealTypes: MenuMealType[] = ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"];
const bookingStatuses: BookingStatus[] = ["pending", "confirmed", "preparing", "completed", "cancelled"];

const tabs: Array<{ id: AdminTab; label: string; Icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "users", label: "User management", Icon: Users },
  { id: "bookings", label: "Booking management", Icon: CalendarDays },
  { id: "menus", label: "Menu management", Icon: Utensils },
  { id: "catalog", label: "Foods & ingredients", Icon: Apple },
  { id: "hotels", label: "Hotel management", Icon: Building2 },
  { id: "kitchen", label: "Kitchen team", Icon: ChefHat },
];

const blankMenuForm: MenuForm = {
  hotelName: "",
  name: "",
  mealType: "Breakfast",
  description: "",
  ingredientsText: "",
  instructions: "",
};

const blankHotelForm = { name: "", location: "", description: "", contactName: "", phone: "", email: "" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Administrator");
  const [adminId, setAdminId] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [menus, setMenus] = useState<MenuEntry[]>([]);
  const [foods, setFoods] = useState<CatalogEntry[]>([]);
  const [ingredients, setIngredients] = useState<CatalogEntry[]>([]);
  const [hotels, setHotels] = useState<HotelEntry[]>([]);
  const [tasks, setTasks] = useState<KitchenTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const [editingMenuId, setEditingMenuId] = useState("");
  const [menuForm, setMenuForm] = useState<MenuForm>(blankMenuForm);
  const [foodName, setFoodName] = useState("");
  const [ingredientName, setIngredientName] = useState("");
  const [editingFoodId, setEditingFoodId] = useState("");
  const [editingIngredientId, setEditingIngredientId] = useState("");
  const [editingHotelId, setEditingHotelId] = useState("");
  const [hotelForm, setHotelForm] = useState(blankHotelForm);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [taskForm, setTaskForm] = useState({ assignedTo: "", bookingId: "", menuId: "", notes: "" });
  const router = useRouter();

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    setPageError("");
    try {
      const [account, userResult, bookingResult, menuResult, foodResult, ingredientResult, hotelResult, taskResult] = await Promise.all([
        request<{ user: { id: string; name: string } }>("/auth/me"),
        request<{ users: AdminUser[] }>("/admin/users"),
        request<{ bookings: AdminBooking[] }>("/admin/bookings"),
        request<{ menus: MenuEntry[] }>("/admin/menus"),
        request<{ foods: CatalogEntry[] }>("/admin/foods"),
        request<{ ingredients: CatalogEntry[] }>("/admin/ingredients"),
        request<{ hotels: HotelEntry[] }>("/admin/hotels"),
        request<{ tasks: KitchenTask[] }>("/admin/kitchen/tasks"),
      ]);
      setAdminName(account.user.name);
      setAdminId(account.user.id);
      setUsers(userResult.users);
      setBookings(bookingResult.bookings);
      setMenus(menuResult.menus);
      setFoods(foodResult.foods);
      setIngredients(ingredientResult.ingredients);
      setHotels(hotelResult.hotels);
      setTasks(taskResult.tasks);
      setMenuForm((current) => ({
        ...current,
        hotelName: current.hotelName || hotelResult.hotels[0]?.name || "",
      }));
      setTaskForm((current) => ({
        ...current,
        assignedTo: current.assignedTo || userResult.users.find((user) => user.role === "kitchenTeam")?.id || "",
        bookingId: current.bookingId || bookingResult.bookings[0]?.id || "",
        menuId: current.menuId || menuResult.menus[0]?.id || "",
      }));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function updateUserRole(user: AdminUser, role: AdminRole) {
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      await request(`/admin/users/${user.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setMessage(`${user.name}'s role has been updated.`);
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update the user role.");
    } finally {
      setBusy(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      await request(`/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage("Booking status updated.");
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update booking status.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCatalogEntry(kind: "food" | "ingredient", name: string, id: string) {
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      const resource = kind === "food" ? "foods" : "ingredients";
      await request(id ? `/admin/${resource}/${id}` : `/admin/${resource}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ name }),
      });
      setMessage(`${kind === "food" ? "Food" : "Ingredient"} ${id ? "updated" : "added"}.`);
      if (kind === "food") {
        setFoodName("");
        setEditingFoodId("");
      } else {
        setIngredientName("");
        setEditingIngredientId("");
      }
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : `Unable to save this ${kind}.`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCatalogEntry(kind: "food" | "ingredient", entry: CatalogEntry) {
    if (!window.confirm(`Remove "${entry.name}" from the ${kind} catalog?`)) return;
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      await request(`/admin/${kind === "food" ? "foods" : "ingredients"}/${entry.id}`, { method: "DELETE" });
      setMessage(`${kind === "food" ? "Food" : "Ingredient"} removed.`);
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : `Unable to remove this ${kind}.`);
    } finally {
      setBusy(false);
    }
  }

  async function saveHotel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      await request(editingHotelId ? `/admin/hotels/${editingHotelId}` : "/admin/hotels", {
        method: editingHotelId ? "PUT" : "POST",
        body: JSON.stringify(hotelForm),
      });
      setMessage(editingHotelId ? "Hotel details updated." : "Hotel added.");
      setEditingHotelId("");
      setHotelForm(blankHotelForm);
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save hotel details.");
    } finally {
      setBusy(false);
    }
  }

  function editHotel(hotel: HotelEntry) {
    setEditingHotelId(hotel.id);
    setHotelForm({
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
      contactName: hotel.contactName,
      phone: hotel.phone,
      email: hotel.email,
    });
    setActiveTab("hotels");
  }

  async function deleteHotel(hotel: HotelEntry) {
    if (!window.confirm(`Delete "${hotel.name}"?`)) return;
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      await request(`/admin/hotels/${hotel.id}`, { method: "DELETE" });
      setMessage("Hotel deleted.");
      if (editingHotelId === hotel.id) {
        setEditingHotelId("");
        setHotelForm(blankHotelForm);
      }
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete this hotel.");
    } finally {
      setBusy(false);
    }
  }

  function editMenu(menu: MenuEntry) {
    setEditingMenuId(menu.id);
    setMenuForm({
      hotelName: menu.hotelName,
      name: menu.name,
      mealType: menu.mealType,
      description: menu.description,
      ingredientsText: menu.ingredients.join("\n"),
      instructions: menu.instructions,
    });
    setActiveTab("menus");
  }

  function resetMenuForm() {
    setEditingMenuId("");
    setMenuForm(blankMenuForm);
  }

  async function saveMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPageError("");
    setMessage("");
    const body = JSON.stringify({
      hotelName: menuForm.hotelName,
      name: menuForm.name,
      mealType: menuForm.mealType,
      description: menuForm.description,
      ingredients: menuForm.ingredientsText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      instructions: menuForm.instructions,
    });
    try {
      await request(editingMenuId ? `/admin/menus/${editingMenuId}` : "/admin/menus", {
        method: editingMenuId ? "PUT" : "POST",
        body,
      });
      setMessage(editingMenuId ? "Menu updated." : "Menu created.");
      resetMenuForm();
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save this menu.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMenu(menu: MenuEntry) {
    if (!window.confirm(`Delete "${menu.name}" from ${menu.hotelName}?`)) return;
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      await request(`/admin/menus/${menu.id}`, { method: "DELETE" });
      setMessage("Menu deleted.");
      if (editingMenuId === menu.id) resetMenuForm();
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete this menu.");
    } finally {
      setBusy(false);
    }
  }

  async function dispatchKitchenTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPageError("");
    setMessage("");
    try {
      await request("/admin/kitchen/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm),
      });
      setMessage("Recipe and ingredient list sent to the kitchen team.");
      setTaskForm((current) => ({ ...current, notes: "" }));
      await loadData(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to send the kitchen task.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setPageError("");
    try {
      await request("/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to sign out.");
      setSigningOut(false);
    }
  }

  const kitchenUsers = users.filter((user) => user.role === "kitchenTeam");
  const initials = adminName.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "AD";

  return (
    <main className="guest-dashboard admin-dashboard">
      {sidebarOpen && <button className="dashboard-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/dashboard/admin">
          <span className="dashboard-brand-icon" aria-hidden="true" />
          <span>Menu<span>Pilot</span><small>ADMIN CONSOLE</small></span>
        </Link>
        <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        <div className="guest-profile">
          <span className="guest-avatar">{initials}</span>
          <span><b>{adminName}</b><small>Administrator</small></span>
        </div>
        <div className="sidebar-label">MANAGEMENT</div>
        <nav className="dashboard-nav" aria-label="Admin management">
          {tabs.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              className={activeTab === id ? "active" : ""}
              aria-current={activeTab === id ? "page" : undefined}
              onClick={() => { setActiveTab(id); setSidebarOpen(false); setPageError(""); setMessage(""); }}
            >
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-icon"><CircleHelp size={17} /></span><div><b>Admin console</b><small>Manage your operations.</small></div><ArrowUpRight size={16} /></div>
          <button className="sidebar-logout" onClick={signOut} disabled={signingOut}><LogOut size={17} /> {signingOut ? "Signing out..." : "Sign out"}</button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <button className="dashboard-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><MenuIcon size={20} /></button>
            <span>Admin</span><ChevronRight size={15} /><b>{tabs.find((tab) => tab.id === activeTab)?.label}</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">MenuPilot administration</span>
            <button className="dashboard-bell" aria-label="Admin account"><Bell size={19} /></button>
            <div className="dashboard-account"><span className="top-avatar">{initials}</span><span className="dashboard-account-info"><b>{adminName}</b><small>Administrator</small></span></div>
          </div>
        </header>

        <div className="dashboard-content dashboard-section-content admin-content">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><i /> MENUPILOT OPERATIONS</div>
              <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
              <p>Manage accounts, bookings, property menus and kitchen preparation.</p>
            </div>
          </section>
          {pageError && <p className="dashboard-auth-error" role="alert">{pageError}</p>}
          {message && <p className="admin-success-message" role="status">{message}</p>}
          {loading ? <section className="admin-empty-state">Loading management data...</section> : (
            <>
              {activeTab === "overview" && (
                <section className="admin-overview-grid">
                  {[
                    { label: "Total accounts", value: users.length, Icon: Users },
                    { label: "Active bookings", value: bookings.filter((booking) => !["completed", "cancelled"].includes(booking.status)).length, Icon: CalendarDays },
                    { label: "Menu recipes", value: menus.length, Icon: BookOpen },
                    { label: "Kitchen tasks", value: tasks.filter((task) => !["ready", "cancelled"].includes(task.status)).length, Icon: ChefHat },
                    { label: "Hotels", value: hotels.length, Icon: Building2 },
                    { label: "Foods & ingredients", value: foods.length + ingredients.length, Icon: Apple },
                  ].map(({ label, value, Icon }) => (
                    <article className="admin-stat-card" key={label}><span><Icon size={18} /></span><small>{label}</small><b>{value}</b></article>
                  ))}
                  <section className="admin-card admin-overview-card">
                    <div className="admin-card-heading"><div><h2>Recent bookings</h2><p>Latest guest plans across your properties.</p></div><button type="button" className="admin-text-button" onClick={() => setActiveTab("bookings")}>Manage bookings <ChevronRight size={14} /></button></div>
                    {bookings.slice(0, 5).map((booking) => (
                      <div className="admin-list-row" key={booking.id}><div><b>{booking.guest.name}</b><small>{formatDate(booking.date)} · {booking.guestCount} guests</small></div><span className={`admin-status ${booking.status}`}>{booking.status}</span></div>
                    ))}
                    {!bookings.length && <p className="admin-empty-state">No bookings have been submitted yet.</p>}
                  </section>
                  <section className="admin-card admin-overview-card">
                    <div className="admin-card-heading"><div><h2>Kitchen team</h2><p>Work sent for preparation.</p></div><button type="button" className="admin-text-button" onClick={() => setActiveTab("kitchen")}>Open kitchen <ChevronRight size={14} /></button></div>
                    {tasks.slice(0, 5).map((task) => (
                      <div className="admin-list-row" key={task.id}><div><b>{task.recipeName}</b><small>{task.assignedTo.name} · {formatDate(task.booking.date)}</small></div><span className={`admin-status ${task.status}`}>{task.status}</span></div>
                    ))}
                    {!tasks.length && <p className="admin-empty-state">No kitchen tasks sent yet.</p>}
                  </section>
                </section>
              )}

              {activeTab === "users" && (
                <section className="admin-card">
                  <div className="admin-card-heading"><div><h2>User accounts</h2><p>Change account access between admin, kitchen team and guest.</p></div><span className="booking-total">{users.length} accounts</span></div>
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>USER</th><th>CONTACT</th><th>GUESTS</th><th>ROLE</th></tr></thead><tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td><b>{user.name}</b><small>{user.email}</small></td>
                        <td>{user.phone || "—"}</td>
                        <td>{user.guestCount}{user.childrenCount ? ` (${user.childrenCount} children)` : ""}</td>
                        <td><select className="admin-role-select" aria-label={`Role for ${user.name}`} value={user.role} disabled={busy || user.id === adminId} onChange={(event) => {
                          const role = event.target.value;
                          if (role === "admin" || role === "kitchenTeam" || role === "guest") void updateUserRole(user, role);
                        }}><option value="guest">Guest</option><option value="kitchenTeam">Kitchen team</option><option value="admin">Admin</option></select></td>
                      </tr>
                    ))}
                    {!users.length && <tr><td colSpan={4}>No accounts found.</td></tr>}
                  </tbody></table></div>
                </section>
              )}

              {activeTab === "bookings" && (
                <section className="admin-card">
                  <div className="admin-card-heading"><div><h2>All bookings</h2><p>Review guest plans and update their booking status.</p></div><span className="booking-total">{bookings.length} bookings</span></div>
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>GUEST / DATE</th><th>PARTY</th><th>MEALS</th><th>BOOKING STATUS</th><th>DETAILS</th></tr></thead><tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td><b>{booking.guest.name}</b><small>{booking.guest.email} · {formatDate(booking.date)}</small></td>
                        <td>{booking.guestCount} guests{booking.childrenCount ? ` · ${booking.childrenCount} children` : ""}</td>
                        <td>{booking.meals.map((meal) => meal.name || meal.type).join(", ") || "—"}</td>
                        <td><select className="admin-role-select" aria-label={`Booking status for ${booking.guest.name}`} disabled={busy} value={booking.status} onChange={(event) => {
                          const status = event.target.value;
                          if (bookingStatuses.includes(status as BookingStatus)) void updateBookingStatus(booking.id, status as BookingStatus);
                        }}>{bookingStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></td>
                        <td><button type="button" className="admin-icon-button" aria-label={`View booking for ${booking.guest.name}`} onClick={() => setSelectedBooking(booking)}><Eye size={16} /></button></td>
                      </tr>
                    ))}
                    {!bookings.length && <tr><td colSpan={5}>No bookings found.</td></tr>}
                  </tbody></table></div>
                  {selectedBooking && (
                    <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedBooking(null); }}>
                      <section className="admin-booking-modal" role="dialog" aria-modal="true" aria-labelledby="admin-booking-title">
                        <button className="admin-modal-close" type="button" aria-label="Close booking details" onClick={() => setSelectedBooking(null)}><X size={18} /></button>
                        <div className="dashboard-eyebrow"><i /> BOOKING DETAILS</div>
                        <h2 id="admin-booking-title">{selectedBooking.guest.name}</h2>
                        <p className="admin-modal-subtitle">{selectedBooking.guest.email} · {formatDate(selectedBooking.date)}</p>
                        <div className="admin-booking-facts">
                          <span><b>Guests</b>{selectedBooking.guestCount} ({selectedBooking.childrenCount} children)</span>
                          <span><b>Drivers</b>{selectedBooking.driverCount}</span>
                          <span><b>Guides</b>{selectedBooking.guideCount}</span>
                          <span><b>Status</b>{selectedBooking.status}</span>
                        </div>
                        <div className="admin-booking-facts">
                          <span><b>Diet</b>{selectedBooking.isVegetarian ? "Vegetarian" : "No vegetarian preference"}</span>
                          <span><b>Allergies</b>{selectedBooking.hasAllergies ? `${selectedBooking.allergyCount} guest(s)` : "None reported"}</span>
                        </div>
                        <h3>Meals and selections</h3>
                        <div className="admin-booking-meals">
                          {selectedBooking.meals.map((meal, index) => (
                            <article key={`${meal.type}-${meal.time}-${index}`}>
                              <b>{meal.name || meal.type} · {meal.time}</b>
                              <span>Foods: {meal.foods.map((food) => food.name).join(", ") || "None"}</span>
                              {meal.hasIngredients && <span>Guest bringing: {meal.ingredients.map((ingredient) => ingredient.name).join(", ") || "Not specified"}</span>}
                            </article>
                          ))}
                        </div>
                        {selectedBooking.notes && <div className="admin-booking-notes"><b>Guest notes</b><p>{selectedBooking.notes}</p></div>}
                      </section>
                    </div>
                  )}
                </section>
              )}

              {activeTab === "catalog" && (
                <section className="admin-catalog-grid">
                  {([
                    { kind: "food" as const, title: "Foods", entries: foods, value: foodName, setValue: setFoodName, editId: editingFoodId, setEditId: setEditingFoodId },
                    { kind: "ingredient" as const, title: "Ingredients", entries: ingredients, value: ingredientName, setValue: setIngredientName, editId: editingIngredientId, setEditId: setEditingIngredientId },
                  ]).map(({ kind, title, entries, value, setValue, editId, setEditId }) => (
                    <section className="admin-card admin-catalog-card" key={kind}>
                      <div className="admin-card-heading"><div><h2>{title}</h2><p>Add, rename or remove entries in the shared catalog.</p></div><span className="booking-total">{entries.length}</span></div>
                      <form className="admin-catalog-form" onSubmit={(event) => { event.preventDefault(); void saveCatalogEntry(kind, value, editId); }}>
                        <label htmlFor={`${kind}-catalog-name`}>{editId ? `Rename ${kind}` : `Add ${kind}`}</label>
                        <div><input id={`${kind}-catalog-name`} required maxLength={100} value={value} onChange={(event) => setValue(event.target.value)} placeholder={kind === "food" ? "e.g. String hoppers" : "e.g. Coconut milk"} /><button type="submit" className="admin-primary-button" disabled={busy}><Save size={14} />{editId ? "Update" : "Add"}</button></div>
                        {editId && <button type="button" className="admin-inline-cancel" onClick={() => { setEditId(""); setValue(""); }}>Cancel rename</button>}
                      </form>
                      <div className="admin-catalog-list">
                        {entries.map((entry) => (
                          <div className="admin-catalog-row" key={entry.id}>
                            <span>{entry.name}</span>
                            <div><button className="admin-icon-button" type="button" aria-label={`Rename ${entry.name}`} onClick={() => { setEditId(entry.id); setValue(entry.name); }}><Pencil size={14} /></button><button className="admin-icon-button danger" type="button" aria-label={`Remove ${entry.name}`} disabled={busy} onClick={() => void deleteCatalogEntry(kind, entry)}><Trash2 size={14} /></button></div>
                          </div>
                        ))}
                        {!entries.length && <p className="admin-empty-state">No {title.toLowerCase()} added yet.</p>}
                      </div>
                    </section>
                  ))}
                </section>
              )}

              {activeTab === "hotels" && (
                <div className="admin-hotels-layout">
                  <form className="admin-card admin-hotel-form" onSubmit={saveHotel}>
                    <div className="admin-card-heading"><div><h2>{editingHotelId ? "Update hotel" : "Add a hotel"}</h2><p>Keep property details available for menu planning.</p></div>{editingHotelId && <button type="button" className="admin-icon-button" aria-label="Cancel hotel edit" onClick={() => { setEditingHotelId(""); setHotelForm(blankHotelForm); }}><X size={16} /></button>}</div>
                    <label>Hotel name<input required maxLength={100} value={hotelForm.name} onChange={(event) => setHotelForm((form) => ({ ...form, name: event.target.value }))} placeholder="e.g. Villa Serene" /></label>
                    <label>Location<input required maxLength={150} value={hotelForm.location} onChange={(event) => setHotelForm((form) => ({ ...form, location: event.target.value }))} placeholder="City, province" /></label>
                    <label>Description <small>Optional</small><textarea rows={3} maxLength={500} value={hotelForm.description} onChange={(event) => setHotelForm((form) => ({ ...form, description: event.target.value }))} placeholder="A short description of the property..." /></label>
                    <label>Contact person <small>Optional</small><input maxLength={100} value={hotelForm.contactName} onChange={(event) => setHotelForm((form) => ({ ...form, contactName: event.target.value }))} placeholder="Hotel contact name" /></label>
                    <div className="admin-form-row">
                      <label>Contact phone<input type="tel" maxLength={24} value={hotelForm.phone} onChange={(event) => setHotelForm((form) => ({ ...form, phone: event.target.value }))} placeholder="+94..." /></label>
                      <label>Contact email<input type="email" maxLength={254} value={hotelForm.email} onChange={(event) => setHotelForm((form) => ({ ...form, email: event.target.value }))} placeholder="hotel@example.com" /></label>
                    </div>
                    <div className="admin-form-actions">{editingHotelId && <button type="button" className="admin-secondary-button" onClick={() => { setEditingHotelId(""); setHotelForm(blankHotelForm); }}>Cancel</button>}<button type="submit" className="admin-primary-button" disabled={busy}><Save size={15} />{busy ? "Saving..." : editingHotelId ? "Update hotel" : "Save hotel"}</button></div>
                  </form>
                  <section className="admin-hotel-list">
                    <div className="admin-card-heading"><div><h2>Hotels</h2><p>{hotels.length} properties managed.</p></div></div>
                    {hotels.map((hotel) => (
                      <article className="admin-hotel-card" key={hotel.id}>
                        <div className="admin-menu-card-heading"><div><h3>{hotel.name}</h3><small>{hotel.location}</small></div><div className="admin-row-actions"><button type="button" className="admin-icon-button" aria-label={`Edit ${hotel.name}`} onClick={() => editHotel(hotel)}><Pencil size={15} /></button><button type="button" className="admin-icon-button danger" aria-label={`Delete ${hotel.name}`} disabled={busy} onClick={() => void deleteHotel(hotel)}><Trash2 size={15} /></button></div></div>
                        {hotel.description && <p>{hotel.description}</p>}
                        {(hotel.contactName || hotel.phone || hotel.email) && <small className="admin-hotel-contact">{[hotel.contactName, hotel.phone, hotel.email].filter(Boolean).join(" · ")}</small>}
                      </article>
                    ))}
                    {!hotels.length && <div className="admin-empty-state">No hotels added yet. Create one to use it in menus.</div>}
                  </section>
                </div>
              )}

              {activeTab === "menus" && (
                <div className="admin-menus-layout">
                  <form className="admin-card admin-menu-form" onSubmit={saveMenu}>
                    <div className="admin-card-heading"><div><h2>{editingMenuId ? "Update menu" : "Create a menu"}</h2><p>Add a recipe that can be sent to a kitchen team.</p></div>{editingMenuId && <button type="button" className="admin-icon-button" aria-label="Cancel editing" onClick={resetMenuForm}><X size={16} /></button>}</div>
                    <label>Hotel or property<select required value={menuForm.hotelName} onChange={(event) => setMenuForm((form) => ({ ...form, hotelName: event.target.value }))}><option value="">Select a managed hotel</option>{hotels.map((hotel) => <option value={hotel.name} key={hotel.id}>{hotel.name} · {hotel.location}</option>)}</select>{!hotels.length && <small>Add a hotel in Hotel management before creating a menu.</small>}</label>
                    <div className="admin-form-row">
                      <label>Recipe name<input required maxLength={100} value={menuForm.name} onChange={(event) => setMenuForm((form) => ({ ...form, name: event.target.value }))} placeholder="e.g. Coconut chicken curry" /></label>
                      <label>Meal type<select value={menuForm.mealType} onChange={(event) => setMenuForm((form) => ({ ...form, mealType: event.target.value as MenuMealType }))}>{mealTypes.map((meal) => <option key={meal}>{meal}</option>)}</select></label>
                    </div>
                    <label>Menu description <small>Optional</small><textarea rows={2} maxLength={500} value={menuForm.description} onChange={(event) => setMenuForm((form) => ({ ...form, description: event.target.value }))} placeholder="Short description of this dish..." /></label>
                    <label>Ingredients <small>One per line; include quantities and units</small><textarea required rows={5} value={menuForm.ingredientsText} onChange={(event) => setMenuForm((form) => ({ ...form, ingredientsText: event.target.value }))} placeholder={"Chicken - 1 kg\nCoconut milk - 500 ml\nCurry leaves - 1 handful"} /></label>
                    <label>Preparation instructions<textarea required rows={5} maxLength={5000} value={menuForm.instructions} onChange={(event) => setMenuForm((form) => ({ ...form, instructions: event.target.value }))} placeholder="Write the recipe steps for the kitchen team..." /></label>
                    <div className="admin-form-actions">{editingMenuId && <button type="button" className="admin-secondary-button" onClick={resetMenuForm}>Cancel</button>}<button className="admin-primary-button" disabled={busy}><Save size={15} />{busy ? "Saving..." : editingMenuId ? "Update menu" : "Save menu"}</button></div>
                  </form>
                  <section className="admin-menu-list">
                    <div className="admin-card-heading"><div><h2>Saved menus</h2><p>{menus.length} recipes available to assign.</p></div></div>
                    {menus.map((menu) => (
                      <article className="admin-menu-card" key={menu.id}>
                        <div className="admin-menu-card-heading"><div><span className="admin-menu-meal">{menu.mealType}</span><h3>{menu.name}</h3><small>{menu.hotelName}</small></div><div className="admin-row-actions"><button className="admin-icon-button" type="button" aria-label={`Edit ${menu.name}`} onClick={() => editMenu(menu)}><Pencil size={15} /></button><button className="admin-icon-button danger" type="button" aria-label={`Delete ${menu.name}`} disabled={busy} onClick={() => void deleteMenu(menu)}><Trash2 size={15} /></button></div></div>
                        {menu.description && <p>{menu.description}</p>}
                        <small className="admin-menu-ingredients"><b>Ingredients:</b> {menu.ingredients.join(", ")}</small>
                      </article>
                    ))}
                    {!menus.length && <div className="admin-empty-state">No menus yet. Create a recipe to get started.</div>}
                  </section>
                </div>
              )}

              {activeTab === "kitchen" && (
                <div className="admin-kitchen-layout">
                  <form className="admin-card admin-task-form" onSubmit={dispatchKitchenTask}>
                    <div className="admin-card-heading"><div><h2>Send work to kitchen</h2><p>Assign a recipe and its ingredient list to a booking.</p></div></div>
                    <label>Kitchen team member<select required value={taskForm.assignedTo} onChange={(event) => setTaskForm((form) => ({ ...form, assignedTo: event.target.value }))}><option value="">Select a kitchen team member</option>{kitchenUsers.map((user) => <option value={user.id} key={user.id}>{user.name} · {user.email}</option>)}</select></label>
                    <label>Booking<select required value={taskForm.bookingId} onChange={(event) => setTaskForm((form) => ({ ...form, bookingId: event.target.value }))}><option value="">Select a booking</option>{bookings.filter((booking) => booking.status !== "cancelled").map((booking) => <option value={booking.id} key={booking.id}>{booking.guest.name} · {formatDate(booking.date)} · {booking.guestCount} guests</option>)}</select></label>
                    <label>Menu / recipe<select required value={taskForm.menuId} onChange={(event) => setTaskForm((form) => ({ ...form, menuId: event.target.value }))}><option value="">Select a recipe</option>{menus.map((menu) => <option value={menu.id} key={menu.id}>{menu.name} · {menu.hotelName}</option>)}</select></label>
                    {menus.find((menu) => menu.id === taskForm.menuId) && <div className="admin-ingredient-preview"><b>Ingredient supply list</b><span>{menus.find((menu) => menu.id === taskForm.menuId)?.ingredients.join(" · ")}</span></div>}
                    <label>Kitchen notes <small>Optional</small><textarea rows={3} maxLength={1000} value={taskForm.notes} onChange={(event) => setTaskForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Add timing, preparation or delivery notes..." /></label>
                    <button className="admin-primary-button" disabled={busy || !kitchenUsers.length || !bookings.length || !menus.length}><Send size={15} />{busy ? "Sending..." : "Send recipe to kitchen"}</button>
                    {!kitchenUsers.length && <small className="admin-form-hint">Add a user with the Kitchen team role before assigning work.</small>}
                  </form>
                  <section className="admin-task-list">
                    <div className="admin-card-heading"><div><h2>Kitchen task history</h2><p>Recipe and supply tasks sent to your team.</p></div></div>
                    {tasks.map((task) => (
                      <article className="admin-task-card" key={task.id}>
                        <div className="admin-task-heading"><div><span className={`admin-status ${task.status}`}>{task.status}</span><h3>{task.recipeName}</h3><small>{task.hotelName} · {task.mealType}</small></div><ChefHat size={19} /></div>
                        <div className="admin-task-meta"><span><b>Assigned to</b>{task.assignedTo.name}</span><span><b>Booking</b>{formatDate(task.booking.date)} · {task.booking.guestCount} guests</span></div>
                        <p><b>Supplies:</b> {task.ingredients.join(", ")}</p>
                        {task.notes && <small className="admin-task-note">{task.notes}</small>}
                      </article>
                    ))}
                    {!tasks.length && <div className="admin-empty-state">No kitchen tasks yet. Send a recipe to start coordination.</div>}
                  </section>
                </div>
              )}
            </>
          )}
          <footer className="dashboard-footer"><span>MenuPilot Admin Console</span><span>Manage with care</span></footer>
        </div>
      </section>
    </main>
  );
}
