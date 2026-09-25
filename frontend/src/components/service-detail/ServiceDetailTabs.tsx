import { Activity, BarChart3, AlertOctagon, Settings } from "lucide-react";

export type ServiceTab = "status" | "analytics" | "incidents" | "settings";

interface ServiceDetailTabsProps {
  activeTab: ServiceTab;
  onTabChange: (tab: ServiceTab) => void;
}

export function ServiceDetailTabs({ activeTab, onTabChange }: ServiceDetailTabsProps) {
  const tabs: { id: ServiceTab; label: string; icon: React.ElementType }[] = [
    { id: "status", label: "Status", icon: Activity },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "incidents", label: "Incidents", icon: AlertOctagon },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 bg-white/40 dark:bg-slate-900/40 p-1.5 sm:p-2 rounded-3xl sm:rounded-full border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-xl w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 text-xs font-semibold rounded-full px-3 py-2.5 transition-all duration-300 ${
                isActive
                  ? "bg-white/90 dark:bg-white/20 text-foreground shadow-md backdrop-blur-md border border-white/60 dark:border-white/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/10"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "text-emerald-600 dark:text-emerald-400 scale-110" : "text-muted-foreground"}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
