import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CheckTimeline } from "./CheckTimeline";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { useCheckHistory } from "@/hooks/useCheckHistory";
import type { Service } from "@/schemas/service.schema";
import { RefreshCw, Clock, Zap, ShieldCheck } from "lucide-react";

interface StatusTabProps {
  service: Service;
  isActive: boolean;
}

function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Never";
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function StatusTab({ service, isActive }: StatusTabProps) {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { data: checks = [], isLoading, isFetching, refetch } = useCheckHistory(
    service.id,
    isActive,
    autoRefreshEnabled ? 5000 : false
  );
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isActive || !autoRefreshEnabled) return;

    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, autoRefreshEnabled, isFetching]);

  const lastCheck = checks[0] || {
    status_code: service.last_status_code ?? 200,
    response_time_ms: service.last_response_time_ms ?? 0,
    checked_at: service.last_checked_at ?? new Date().toISOString(),
    ok: service.last_check_ok ?? true,
  };

  return (
    <div className="space-y-6">
      {/* Live Polling Indicator & Auto-Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/30 px-5 py-3 text-xs text-muted-foreground backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-medium">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-primary" : "text-emerald-500"}`} />
            <span className="text-foreground font-semibold">
              {autoRefreshEnabled ? "Live Polling (5s)" : "Auto Refresh Paused"}
            </span>
          </div>

          {autoRefreshEnabled && (
            <span className="text-muted-foreground">
              • Next refresh in <span className="font-mono font-bold text-foreground">{countdown}s</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh-toggle"
              checked={autoRefreshEnabled}
              onCheckedChange={(checked) => setAutoRefreshEnabled(Boolean(checked))}
            />
            <label
              htmlFor="auto-refresh-toggle"
              className="cursor-pointer font-medium text-foreground text-xs select-none"
            >
              Auto-refresh
            </label>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetch();
              if (autoRefreshEnabled) setCountdown(5);
            }}
            disabled={isFetching}
            className="h-7 text-xs px-2.5 gap-1.5 rounded-lg border-border/60 hover:bg-background"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Current Health"
          value={lastCheck.ok ? "Passing" : "Failing"}
          icon={ShieldCheck}
          variant="mint"
          subtext={`Expected: ${service.expected_status || 200} OK`}
        />

        <KPICard
          title="Response Time"
          value={
            lastCheck.response_time_ms !== null && lastCheck.response_time_ms !== undefined
              ? `${lastCheck.response_time_ms} ms`
              : "N/A"
          }
          icon={Zap}
          variant="teal"
          subtext="Target: < 500ms"
        />

        <KPICard
          title="Status Code"
          value={lastCheck.status_code ?? "Timeout"}
          icon={Zap}
          variant="default"
          subtext={`Check Interval: ${service.check_interval_sec}s`}
        />

        <KPICard
          title="Last Checked"
          value={formatTimeAgo(lastCheck.checked_at)}
          icon={Clock}
          variant="default"
          subtext={lastCheck.checked_at ? new Date(lastCheck.checked_at).toLocaleTimeString() : "Never"}
        />
      </div>

      {/* Visual Dot Sparkline */}
      <Card className="rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl text-foreground p-0 shadow-md overflow-hidden">
        <CardHeader className="bg-white/40 dark:bg-white/10 border-b border-white/30 dark:border-white/10 p-5">
          <CardTitle className="text-base font-semibold text-foreground">Recent Probe Timeline</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Visual status history of recent checks</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <CheckTimeline checks={checks} />
        </CardContent>
      </Card>

      {/* Checks Table */}
      <Card className="rounded-[2.5rem] border border-white/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl text-foreground p-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-white/10 border-b border-white/40 dark:border-white/10 p-5">
          <CardTitle className="text-base font-semibold text-foreground">Check Log History (Last 10)</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Detailed historical probe results</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <SkeletonCard className="h-12 w-full" />
              <SkeletonCard className="h-12 w-full" />
              <SkeletonCard className="h-12 w-full" />
            </div>
          ) : checks.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No checks recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead>HTTP Code</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge
                        variant={c.ok ? "outline" : "destructive"}
                        className={
                          c.ok
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {c.ok ? "SUCCESS" : "FAIL"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.status_code !== null ? (
                        <span className={c.ok ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-destructive font-semibold"}>
                          {c.status_code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">No response</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.response_time_ms !== null && c.response_time_ms !== undefined
                        ? `${c.response_time_ms} ms`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.checked_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
