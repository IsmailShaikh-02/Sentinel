import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function MainLayout() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-foreground antialiased selection:bg-emerald-500/20">
      {/* Ambient colorful gradient orbs to create vivid glassmorphism blur contrast */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-[30rem] w-[30rem] rounded-full bg-emerald-400/25 dark:bg-emerald-600/20 blur-3xl opacity-70 animate-pulse" />
        <div className="absolute right-0 top-1/4 h-[35rem] w-[35rem] rounded-full bg-teal-400/20 dark:bg-teal-600/15 blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 dark:bg-cyan-600/15 blur-3xl opacity-70" />
        <div className="absolute right-1/4 -bottom-10 h-[25rem] w-[25rem] rounded-full bg-purple-400/15 dark:bg-purple-600/10 blur-3xl opacity-50" />
      </div>

      {/* Main Glass Layout Container */}
      <div className="relative z-10 flex h-full w-full overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
