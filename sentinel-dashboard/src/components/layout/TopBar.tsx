import { Menu, LogOut, User as UserIcon, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui.store";

export function TopBar() {
  const { user, logout } = useAuth();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShieldAlert className="h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">Monitoring Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1 text-xs font-medium text-foreground border border-border">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="max-w-[180px] truncate">{user.email}</span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="gap-2 text-xs font-medium"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}
