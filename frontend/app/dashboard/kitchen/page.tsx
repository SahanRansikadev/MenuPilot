"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChefHat,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LogOut,
  MessageSquare,
  Menu as MenuIcon,
  ThumbsUp,
  Utensils,
  Users,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";

type KitchenTask = {
  id: string;
  booking: { id: string; date: string; guestCount: number };
  hotelName: string;
  recipeName: string;
  mealType: string;
  description: string;
  ingredients: string[];
  supplies: Array<{ id: string; name: string; quantity: number; unit: string; received: boolean }>;
  foods: Array<{ name: string }>;
  desserts: Array<{ name: string }>;
  guestIngredients: Array<{ name: string }>;
  isVegetarian: boolean;
  hasAllergies: boolean;
  allergyCount: number;
  costingStatus: "not_submitted" | "submitted" | "confirmed" | "cancelled";
  actualTotalPrice: number | null;
  mealIndex: number | null;
  instructions: string;
  notes: string;
  status: "sent" | "accepted" | "preparing" | "ready" | "cancelled";
};

type KitchenMember = { id: string; name: string; email: string };
type GuestFeedback = {
  id: string;
  name: string;
  email: string;
  feedback: string;
  reply: string;
  liked: boolean;
};

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
  if (!value) return "Date not available";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function nextAction(status: KitchenTask["status"]) {
  if (status === "sent") return { status: "accepted", label: "Accept task" };
  if (status === "accepted") return { status: "preparing", label: "Start preparing" };
  if (status === "preparing") return { status: "ready", label: "Mark ready" };
  return null;
}

export default function KitchenTeamPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [member, setMember] = useState<KitchenMember | null>(null);
  const [tasks, setTasks] = useState<KitchenTask[]>([]);
  const [feedback, setFeedback] = useState<GuestFeedback[]>([]);
  const [supplyDrafts, setSupplyDrafts] = useState<Record<string, { received: Record<string, boolean>; actualTotalPrice: string }>>({});
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function loadTasks() {
    setPageError("");
    try {
      const [account, taskResult, feedbackResult] = await Promise.all([
        request<{ user: KitchenMember }>("/auth/me"),
        request<{ tasks: KitchenTask[] }>("/kitchen/tasks"),
        request<{ feedback: GuestFeedback[] }>("/feedback"),
      ]);
      setMember(account.user);
      setTasks(taskResult.tasks);
      setFeedback(feedbackResult.feedback);
      setSupplyDrafts(Object.fromEntries(taskResult.tasks.map((task) => [
        task.id,
        {
          received: Object.fromEntries(task.supplies.map((supply) => [supply.id, supply.received])),
          actualTotalPrice: task.actualTotalPrice === null ? "" : String(task.actualTotalPrice),
        },
      ])));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load kitchen tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function updateStatus(task: KitchenTask, status: string) {
    setBusyTaskId(task.id);
    setPageError("");
    setMessage("");
    try {
      await request(`/kitchen/tasks/${task.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(`"${task.recipeName}" is now ${status}.`);
      await loadTasks();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update this task.");
    } finally {
      setBusyTaskId("");
    }
  }

  async function submitSupply(task: KitchenTask, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = supplyDrafts[task.id];
    if (!draft || draft.actualTotalPrice.trim() === "") {
      setPageError("Enter the actual total supplier price before submitting.");
      return;
    }
    setBusyTaskId(task.id);
    setPageError("");
    setMessage("");
    try {
      const actualTotalPrice = Number(draft.actualTotalPrice);
      if (!Number.isFinite(actualTotalPrice) || actualTotalPrice < 0 || actualTotalPrice > 100000000) {
        throw new Error("Enter a valid actual supplier total.");
      }
      await request(`/kitchen/tasks/${task.id}/supply`, {
        method: "PATCH",
        body: JSON.stringify({
          supplies: task.supplies.map((supply) => ({
            id: supply.id,
            received: Boolean(draft.received[supply.id]),
          })),
          actualTotalPrice,
        }),
      });
      setMessage(`Supply checklist and actual total submitted for "${task.recipeName}".`);
      await loadTasks();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to submit this supply checklist.");
    } finally {
      setBusyTaskId("");
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

  const initials = member?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KT";
  const activeCount = tasks.filter((task) => !["ready", "cancelled"].includes(task.status)).length;

  return (
    <main className="guest-dashboard kitchen-dashboard">
      {sidebarOpen && <button className="dashboard-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/dashboard/kitchen">
          <span className="dashboard-brand-icon" aria-hidden="true" />
          <span>Menu<span>Pilot</span><small>KITCHEN TEAM</small></span>
        </Link>
        <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        <div className="guest-profile"><span className="guest-avatar">{initials}</span><span><b>{member?.name || "Kitchen team"}</b><small>{member?.email || "Team member"}</small></span></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="dashboard-nav" aria-label="Kitchen team">
          <Link className="active" aria-current="page" href="/dashboard/kitchen"><ClipboardList size={18} /><span>Assigned tasks</span></Link>
          <a href="#guest-feedback" onClick={() => setSidebarOpen(false)}><MessageSquare size={18} /><span>Guest feedback</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-icon"><CircleHelp size={17} /></span><div><b>Kitchen coordination</b><small>Recipes and supplies.</small></div><ArrowUpRight size={16} /></div>
          <button className="sidebar-logout" onClick={signOut} disabled={signingOut}><LogOut size={17} />{signingOut ? "Signing out..." : "Sign out"}</button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb"><button className="dashboard-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><MenuIcon size={20} /></button><span>Kitchen team</span><ChevronRight size={15} /><b>Assigned tasks</b></div>
          <div className="dashboard-top-actions"><span className="dashboard-date">Preparation workspace</span><button className="dashboard-bell" aria-label="Kitchen team"><Bell size={19} /></button><div className="dashboard-account"><span className="top-avatar">{initials}</span><span className="dashboard-account-info"><b>{member?.name || "Kitchen team"}</b><small>Kitchen team</small></span></div></div>
        </header>
        <div className="dashboard-content dashboard-section-content admin-content">
          <section className="dashboard-welcome"><div><div className="dashboard-eyebrow"><i /> KITCHEN PREPARATION</div><h1>Assigned tasks</h1><p>Recipes, ingredient supplies and booking details from your administrator.</p></div><span className="booking-total">{activeCount} active tasks</span></section>
          {pageError && <p className="dashboard-auth-error" role="alert">{pageError}</p>}
          {message && <p className="admin-success-message" role="status">{message}</p>}
          {loading ? <div className="admin-empty-state">Loading your tasks...</div> : (
            <section className="kitchen-task-grid">
              {tasks.map((task) => {
                const action = nextAction(task.status);
                return (
                  <article className="kitchen-task-card" key={task.id}>
                    <div className="kitchen-task-card-top"><span className={`admin-status ${task.status}`}>{task.status}</span><span className="kitchen-meal-type">{task.mealType}</span></div>
                    <div className="kitchen-task-title"><span><ChefHat size={20} /></span><div><h2>{task.recipeName}</h2><p>{task.hotelName}</p></div></div>
                    <div className="kitchen-booking-details"><span><CalendarDays size={15} />{formatDate(task.booking.date)}</span><span><Users size={15} />{task.booking.guestCount} guests</span></div>
                    <section className="kitchen-supplies">
                      <h3><Utensils size={15} /> Meal and guest preferences</h3>
                      <p><b>Foods:</b> {task.foods.map((food) => food.name).join(", ") || "Not specified"}</p>
                      <p><b>Desserts:</b> {task.desserts.map((food) => food.name).join(", ") || "None"}</p>
                      <p><b>Guest brings:</b> {task.guestIngredients.map((item) => item.name).join(", ") || "None"}</p>
                      <p><b>Diet:</b> {task.isVegetarian ? "Vegetarian" : "No vegetarian preference"} · {task.hasAllergies ? `${task.allergyCount} guest(s) with allergies` : "No reported allergies"}</p>
                    </section>
                    <section className="kitchen-supplies">
                      <h3><Utensils size={15} /> Ingredient supply list</h3>
                      {task.supplies.length ? (
                        <form className="kitchen-supply-form" onSubmit={(event) => void submitSupply(task, event)}>
                          <ul>{task.supplies.map((supply) => {
                            const received = Boolean(supplyDrafts[task.id]?.received[supply.id]);
                            return <li key={supply.id}>
                              <label className="kitchen-supply-check">
                                <input
                                  type="checkbox"
                                  checked={received}
                                  disabled={task.costingStatus === "confirmed" || task.status === "ready" || task.status === "cancelled"}
                                  onChange={(event) => setSupplyDrafts((current) => ({
                                    ...current,
                                    [task.id]: {
                                      received: { ...current[task.id]?.received, [supply.id]: event.target.checked },
                                      actualTotalPrice: current[task.id]?.actualTotalPrice || "",
                                    },
                                  }))}
                                />
                                <span><b>{supply.name}</b> · {supply.quantity} {supply.unit} <small>{received ? "Received" : "Missing"}</small></span>
                              </label>
                            </li>;
                          })}</ul>
                          <label className="kitchen-total-price">Actual total supplier price
                            <input
                              required
                              type="number"
                              min="0"
                              max="100000000"
                              step="any"
                              value={supplyDrafts[task.id]?.actualTotalPrice || ""}
                              disabled={task.costingStatus === "confirmed" || task.status === "ready" || task.status === "cancelled"}
                              onChange={(event) => setSupplyDrafts((current) => ({
                                ...current,
                                [task.id]: {
                                  received: current[task.id]?.received || {},
                                  actualTotalPrice: event.target.value,
                                },
                              }))}
                            />
                          </label>
                          <button className="admin-primary-button" type="submit" disabled={busyTaskId === task.id || task.costingStatus === "confirmed" || task.status === "ready" || task.status === "cancelled"}>
                            {busyTaskId === task.id ? "Submitting..." : task.costingStatus === "submitted" ? "Update checklist & total" : "Submit checklist & total"}
                          </button>
                          {task.costingStatus === "submitted" && <small className="admin-form-hint">Submitted for admin costing confirmation.</small>}
                        </form>
                      ) : (
                        <div>
                          <ul>{task.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
                          {task.mealIndex !== null && task.mealIndex !== undefined && task.costingStatus !== "confirmed" && task.status !== "ready" && task.status !== "cancelled" && (
                            <form className="kitchen-supply-form" onSubmit={(event) => void submitSupply(task, event)}>
                              <label className="kitchen-total-price">Actual total supplier price<input required type="number" min="0" max="100000000" step="any" value={supplyDrafts[task.id]?.actualTotalPrice || ""} onChange={(event) => setSupplyDrafts((current) => ({ ...current, [task.id]: { received: {}, actualTotalPrice: event.target.value } }))} /></label>
                              <button className="admin-primary-button" type="submit" disabled={busyTaskId === task.id}>{busyTaskId === task.id ? "Submitting..." : "Submit actual total"}</button>
                            </form>
                          )}
                        </div>
                      )}
                    </section>
                    {task.description && <p className="kitchen-task-description">{task.description}</p>}
                    <details className="kitchen-recipe-details"><summary>Preparation instructions</summary><p>{task.instructions}</p></details>
                    {task.notes && <div className="kitchen-task-notes"><b>Admin notes</b><p>{task.notes}</p></div>}
                    <div className="kitchen-task-actions">
                      {action && <button className="admin-primary-button" disabled={busyTaskId === task.id || (action.status === "ready" && task.mealIndex !== null && task.mealIndex !== undefined && !["submitted", "confirmed"].includes(task.costingStatus))} onClick={() => void updateStatus(task, action.status)}>{busyTaskId === task.id ? "Updating..." : action.label}</button>}
                      {["sent", "accepted", "preparing"].includes(task.status) && <button className="admin-secondary-button" disabled={busyTaskId === task.id} onClick={() => void updateStatus(task, "cancelled")}>Decline</button>}
                    </div>
                  </article>
                );
              })}
              {!tasks.length && <div className="admin-empty-state kitchen-empty-state"><ChefHat size={25} /><b>No kitchen tasks assigned</b><span>When an administrator sends you a recipe, it will appear here.</span></div>}
            </section>
          )}
          <section className="kitchen-feedback-section" id="guest-feedback" aria-label="Guest feedback">
            <div className="admin-card-heading">
              <div><h2>Guest feedback</h2><p>Guest comments for the property team to review.</p></div>
              <span className="booking-total">{feedback.length} comments</span>
            </div>
            <div className="kitchen-feedback-list">
              {feedback.map((entry) => (
                <article className="kitchen-feedback-card" key={entry.id}>
                  <div className="kitchen-feedback-heading"><span className="admin-feedback-avatar">{entry.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><b>{entry.name}</b><small>{entry.email}</small></div>{entry.liked && <span className="kitchen-feedback-liked"><ThumbsUp size={13} /> Admin liked</span>}</div>
                  <p className="kitchen-feedback-quote">{entry.feedback}</p>
                  {entry.reply && <div className="kitchen-feedback-reply"><b>Admin response</b><p>{entry.reply}</p></div>}
                </article>
              ))}
              {!feedback.length && <div className="admin-empty-state"><MessageSquare size={23} /><b>No guest feedback yet</b><span>Guest comments will appear here when submitted.</span></div>}
            </div>
          </section>
          <footer className="dashboard-footer"><span>MenuPilot Kitchen Workspace</span><span>Prepare with care</span></footer>
        </div>
      </section>
    </main>
  );
}
