"use client";

import { useEffect, useState } from "react";
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
  Menu as MenuIcon,
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
  instructions: string;
  notes: string;
  status: "sent" | "accepted" | "preparing" | "ready" | "cancelled";
};

type KitchenMember = { id: string; name: string; email: string };

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
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function loadTasks() {
    setPageError("");
    try {
      const [account, taskResult] = await Promise.all([
        request<{ user: KitchenMember }>("/auth/me"),
        request<{ tasks: KitchenTask[] }>("/kitchen/tasks"),
      ]);
      setMember(account.user);
      setTasks(taskResult.tasks);
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
                    {task.description && <p className="kitchen-task-description">{task.description}</p>}
                    <section className="kitchen-supplies"><h3><Utensils size={15} /> Ingredient supply list</h3><ul>{task.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul></section>
                    <details className="kitchen-recipe-details"><summary>Preparation instructions</summary><p>{task.instructions}</p></details>
                    {task.notes && <div className="kitchen-task-notes"><b>Admin notes</b><p>{task.notes}</p></div>}
                    <div className="kitchen-task-actions">
                      {action && <button className="admin-primary-button" disabled={busyTaskId === task.id} onClick={() => void updateStatus(task, action.status)}>{busyTaskId === task.id ? "Updating..." : action.label}</button>}
                      {["sent", "accepted", "preparing"].includes(task.status) && <button className="admin-secondary-button" disabled={busyTaskId === task.id} onClick={() => void updateStatus(task, "cancelled")}>Decline</button>}
                    </div>
                  </article>
                );
              })}
              {!tasks.length && <div className="admin-empty-state kitchen-empty-state"><ChefHat size={25} /><b>No kitchen tasks assigned</b><span>When an administrator sends you a recipe, it will appear here.</span></div>}
            </section>
          )}
          <footer className="dashboard-footer"><span>MenuPilot Kitchen Workspace</span><span>Prepare with care</span></footer>
        </div>
      </section>
    </main>
  );
}
