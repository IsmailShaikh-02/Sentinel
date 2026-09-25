import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Plus,
} from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { SentinelLogo } from "../SentinelLogo/SentinelLogo";
import { CreateServiceModal } from "@/components/services/CreateServiceModal";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Services", href: "/services", icon: Server },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "Alerts", href: "/alerts", icon: Bell },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      {/* DESKTOP SIDEBAR (hidden on mobile md:flex) */}
      <aside
        className={cn(
          "hidden md:flex relative flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/40 dark:border-white/10 transition-all duration-300 ease-in-out select-none shadow-xl z-20 text-foreground h-full my-0 ml-0 rounded-br-3xl rounded-tr-3xl",
          sidebarOpen ? "w-60" : "w-20"
        )}
      >
        {/* Brand Logo Header */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <SentinelLogo size={42} />
            </div>

            {sidebarOpen && (
              <div className="flex flex-col justify-center min-w-0 animate-in fade-in-50 duration-200">
                <span className="truncate text-[15px] font-bold tracking-[0.08em] text-foreground">
                  SENTINEL
                </span>
                <span className="truncate text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Health Monitor
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-3.5 pt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={!sidebarOpen ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 group",
                  isActive
                    ? "bg-white/80 dark:bg-white/20 text-foreground shadow-md backdrop-blur-md border border-white/50 dark:border-white/20"
                    : "text-muted-foreground hover:bg-white/40 dark:hover:bg-white/10 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {sidebarOpen && (
                  <span className="truncate tracking-wide">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Account & Logout & Collapse Controls */}
        <div className="space-y-3 border-t border-black/5 dark:border-white/10 p-3.5">
          {user && (
            <>
              {sidebarOpen ? (
                <div className="flex items-center justify-between rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/10 p-2.5 backdrop-blur-md">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-white/20 text-foreground">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="max-w-[110px] truncate text-xs font-semibold text-foreground">
                        {user.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Logged in</span>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    type="button"
                    title="Logout"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={logout}
                  type="button"
                  title="Logout"
                  className="flex h-10 w-full items-center justify-center rounded-2xl border border-white/40 dark:border-white/10 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </>
          )}

          <button
            onClick={toggleSidebar}
            type="button"
            aria-label={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/10 p-2.5 text-xs font-semibold text-foreground hover:bg-white/60 dark:hover:bg-white/20 transition-colors shadow-xs backdrop-blur-md"
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                <span>Collapse Sidebar</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-gradient-to-t from-slate-950/40 via-slate-950/20 to-transparent pointer-events-none">
        {/* Bottom Navigation Container */}
        <div className="pointer-events-auto max-w-md mx-auto relative flex items-center justify-around rounded-full border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl px-3 py-2 shadow-2xl">
          {/* Nav Item 1: Dashboard */}
          {(() => {
            const item = navItems[0];
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.name}
                className={cn(
                  "flex items-center justify-center p-2.5 rounded-full transition-all",
                  isActive
                    ? "bg-white/90 dark:bg-white/20 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })()}

          {/* Nav Item 2: Services */}
          {(() => {
            const item = navItems[1];
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.name}
                className={cn(
                  "flex items-center justify-center p-2.5 rounded-full transition-all",
                  isActive
                    ? "bg-white/90 dark:bg-white/20 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })()}

          {/* Center Floating '+' Add Service Button */}
          <div className="relative -top-4 mx-1">
            <button
              onClick={() => setCreateModalOpen(true)}
              type="button"
              aria-label="Add Service"
              title="Add Service"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 hover:bg-emerald-500 active:scale-95 transition-all border-2 border-white dark:border-slate-900"
            >
              <Plus className="h-5.5 w-5.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Nav Item 3: Incidents */}
          {(() => {
            const item = navItems[2];
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.name}
                className={cn(
                  "flex items-center justify-center p-2.5 rounded-full transition-all",
                  isActive
                    ? "bg-white/90 dark:bg-white/20 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })()}

          {/* Nav Item 4: Alerts */}
          {(() => {
            const item = navItems[3];
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.name}
                className={cn(
                  "flex items-center justify-center p-2.5 rounded-full transition-all",
                  isActive
                    ? "bg-white/90 dark:bg-white/20 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })()}
        </div>
      </div>

      {/* Global Add Service Modal */}
      <CreateServiceModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
}

