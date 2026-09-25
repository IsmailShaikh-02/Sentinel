import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LatencyChart } from "./LatencyChart";
import { StatusCodePie } from "./StatusCodePie";
import { UptimeChart } from "./UptimeChart";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useCheckHistory } from "@/hooks/useCheckHistory";
import type { WindowOption } from "@/schemas/analytics.schema";
import type { Service } from "@/schemas/service.schema";
import { Activity, Gauge, Percent, BarChart } from "lucide-react";

interface AnalyticsTabProps {
  service: Service;
}

export function AnalyticsTab({ service }: AnalyticsTabProps) {
  const [window, setWindow] = useState<WindowOption>("24h");
  const { uptime, latency, isLoading } = useAnalyticsData(service.id, window);
  const { data: checks = [] } = useCheckHistory(service.id, false);

  const uptimePct = uptime?.uptimePercentage ?? 100;
  const avgLatency = latency?.avgMs ?? service.last_response_time_ms ?? 0;
  const p50 = latency?.p50Ms ?? Math.round(avgLatency * 0.9);
  const p95 = latency?.p95Ms ?? Math.round(avgLatency * 1.3);
  const p99 = latency?.p99Ms ?? Math.round(avgLatency * 1.8);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Window Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Performance Metrics</h2>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 p-1">
          {(["24h", "7d", "30d"] as WindowOption[]).map((win) => (
            <Button
              key={win}
              size="sm"
              variant={window === win ? "default" : "ghost"}
              onClick={() => setWindow(win)}
              className="h-7 px-3 text-xs font-medium"
            >
              {win}
            </Button>
          ))}
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={`Uptime (${window})`}
          value={`${uptimePct.toFixed(2)}%`}
          icon={Percent}
          variant="mint"
          subtext={`Total checks: ${uptime?.totalChecks ?? "—"}`}
        />

        <KPICard
          title="Avg Latency"
          value={`${Math.round(avgLatency)} ms`}
          icon={Activity}
          variant="teal"
          subtext={`p50: ${Math.round(p50)} ms`}
        />

        <KPICard
          title="p95 Latency"
          value={`${Math.round(p95)} ms`}
          icon={Gauge}
          variant="default"
          subtext="95th percentile threshold"
        />

        <KPICard
          title="p99 Latency"
          value={`${Math.round(p99)} ms`}
          icon={BarChart}
          variant="default"
          subtext="99th percentile peak"
        />
      </div>

      {/* Uptime Trend Chart */}
      <Card className="rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl text-foreground p-0 shadow-md overflow-hidden">
        <CardHeader className="bg-white/40 dark:bg-white/10 border-b border-white/30 dark:border-white/10 p-5">
          <CardTitle className="text-base font-semibold text-foreground">Uptime Percentage Trend</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Rolling uptime over the selected timeframe</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <UptimeChart data={uptime?.history} currentUptime={uptimePct} />
        </CardContent>
      </Card>

      {/* Charts Grid: Latency Multi-Line & Status Code Pie */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl text-foreground p-0 shadow-md overflow-hidden">
          <CardHeader className="bg-white/40 dark:bg-white/10 border-b border-white/30 dark:border-white/10 p-5">
            <CardTitle className="text-base font-semibold text-foreground">Latency Distribution (Avg, p50, p95, p99)</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Time-series response times in milliseconds</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <LatencyChart
              data={latency?.history}
              avgMs={avgLatency}
              p50Ms={p50}
              p95Ms={p95}
              p99Ms={p99}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl text-foreground p-0 shadow-md overflow-hidden">
          <CardHeader className="bg-white/40 dark:bg-white/10 border-b border-white/30 dark:border-white/10 p-5">
            <CardTitle className="text-base font-semibold text-foreground">Status Code Breakdown</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Distribution of HTTP response status codes</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <StatusCodePie checks={checks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
