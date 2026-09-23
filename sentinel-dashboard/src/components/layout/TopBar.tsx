import { useState } from "react";
import { LogOut, User as UserIcon, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SentinelLogo } from "../SentinelLogo/SentinelLogo";

export function TopBar() {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar (md:hidden) */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 bg-white/75 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-white/50 dark:border-white/10 shadow-md rounded-bl-3xl rounded-br-3xl">
        {/* Left Side: Sentinel Logo */}
        <div className="flex items-center gap-2">
          <SentinelLogo size={32} />
          <span className="text-xs font-bold tracking-wider text-foreground">SENTINEL</span>
        </div>

        {/* Right Side: User Account Icon */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            type="button"
            aria-label="User account"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 border border-white/60 dark:border-white/20 shadow-xs active:scale-95 transition-all backdrop-blur-md"
          >
            <UserIcon className="h-4.5 w-4.5" />
          </button>

          {/* User Logout Popover Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 p-3.5 rounded-3xl border border-white/60 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {user?.email || "Account"}
                  </span>
                </div>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  type="button"
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                type="button"
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
