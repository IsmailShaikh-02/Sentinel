import { useState } from "react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useServices } from "@/hooks/useServices";
import { useIncidents } from "@/hooks/useIncidents";
// import { useAuth } from "@/hooks/useAuth";
import { KPICard } from "@/components/dashboard/KPICard";
import { ServiceHealthGrid } from "@/components/dashboard/ServiceHealthGrid";
import { RecentIncidentsTable } from "@/components/dashboard/RecentIncidentsTable";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, RefreshCw, Server, ShieldCheck } from "lucide-react";

export function DashboardPage() {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  // const { user, logout } = useAuth();

  const {
    data: stats,
    isLoading: isStatsLoading,
    isRefetching: isStatsRefetching,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: services,
    isLoading: isServicesLoading,
    refetch: refetchServices,
  } = useServices();

  const {
    incidents,
    isLoading: isIncidentsLoading,
    refetch: refetchIncidents,
  } = useIncidents();

  const handleRefreshAll = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchServices(),
        refetchIncidents(),
        new Promise((resolve) => setTimeout(resolve, 600)), // Ensure smooth shimmer animation
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const isRefreshing = isManualRefreshing || isStatsRefetching;
  const showShimmer = isRefreshing || isStatsLoading || isServicesLoading || isIncidentsLoading;

  return (
    <div className="space-y-6">
      {/* Header section with manual refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time monitoring telemetry, service health diagnostics, and incident markers.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="self-start sm:self-auto h-9 text-xs gap-1.5 shadow-sm hover:shadow-md hover:border-primary/50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isRefreshing ? "animate-spin text-primary" : ""
            }`}
          />
          {isRefreshing ? "Refreshing Metrics..." : "Refresh Metrics"}
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Services"
          value={stats?.totalServices ?? (services?.length || 0)}
          icon={Server}
          variant="mint"
          isLoading={showShimmer}
          subtext={
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
              {stats?.healthyServices ?? services?.filter((s) => s.last_check_ok !== false).length ?? 0} Healthy Probes
            </span>
          }
        />

        <KPICard
          title="System Uptime"
          value={stats ? `${stats.avgUptimePercentage}%` : "100%"}
          icon={ShieldCheck}
          variant="teal"
          // badge={<span className="text-white text-[11px]">24h Aggregate</span>}
          isLoading={showShimmer}
          subtext="High reliability SLA score"
        />

        <KPICard
          title="Active Incidents"
          value={stats?.activeIncidentsCount ?? 0}
          icon={AlertTriangle}
          variant="default"
          iconClassName={
            stats?.activeIncidentsCount ? "text-destructive animate-pulse" : "text-amber-500"
          }
          isLoading={showShimmer}
          subtext={
            stats?.activeIncidentsCount ? (
              <span className="text-destructive font-semibold">Requires immediate triage</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">All systems nominal</span>
            )
          }
        />

        <KPICard
          title="Worst Latency"
          value={stats ? `${stats.worstP95LatencyMs} ms` : "—"}
          icon={Activity}
          variant="default"
          iconClassName="text-primary"
          isLoading={showShimmer}
          subtext="Max response threshold (p95)"
        />
      </div>

      {/* Service Health Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Service Health Matrix</h2>
          <span className="text-xs text-muted-foreground">
            {services?.length || 0} active probes
          </span>
        </div>
        <ServiceHealthGrid services={services || []} isLoading={showShimmer} />
      </div>

      {/* Recent Incidents Table */}
      <div className="space-y-3">
        <RecentIncidentsTable incidents={incidents || []} isLoading={showShimmer} />
      </div>
    </div>
  );
}
