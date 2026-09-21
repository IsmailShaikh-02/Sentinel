import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Server, AlertTriangle, Bell } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";
import { SentinelLogo } from "../SentinelLogo/SentinelLogo";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Services", href: "/services", icon: Server },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "Alerts", href: "/alerts", icon: Bell },
];

export function Sidebar() {
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out select-none",
        sidebarOpen ? "w-52" : "w-19"
      )}
    >
    
{/* Brand Logo Header */}
<div className="flex h-16 items-center border-b border-border px-4">
  <div className="flex min-w-0 items-center gap-3">
    {/* Logo */}
    <div className="flex h-10 w-10 shrink-0 items-center justify-center">
      <SentinelLogo size={42} 
        pauseDuration={5_000}
        rotationDuration={2_500}
      />
    </div>

    {/* Brand */}
    {sidebarOpen && (
      <div className="flex min-w-0 flex-col justify-center">
        <span className="truncate text-[15px] font-bold leading-none tracking-[0.08em] text-foreground">
          SENTINEL
        </span>

        <span className="mt-1 truncate text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Health Monitor
        </span>
      </div>
    )}
  </div>
</div>


      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={!sidebarOpen ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              {sidebarOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      {sidebarOpen && (
        <div className="p-4 border-t border-border">
          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Sentinel v1.0</p>
            <p className="text-[11px] mt-0.5">System status: <span className="text-emerald-500 font-medium">Operational</span></p>
          </div>
        </div>
      )}
    </aside>
  );
}
