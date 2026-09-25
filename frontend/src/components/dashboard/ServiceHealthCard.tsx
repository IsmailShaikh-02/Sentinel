import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useCheckHistory } from "@/hooks/useCheckHistory";
import type { Service } from "@/schemas/service.schema";
import { ArrowRight, Clock, Activity } from "lucide-react";

export interface ServiceHealthCardProps {
  service: Service;
}

export function ServiceHealthCard({ service }: ServiceHealthCardProps) {
  const { data: checks } = useCheckHistory(service.id, true);

  const isHealthy = service.last_check_ok !== false && service.enabled !== false;
  
  // Calculate completion percentage or uptime for the progress bar
  const recentProbes = checks ? checks.slice(0, 10) : [];
  const okCount = recentProbes.filter((c) => c.ok).length;
  const probePercentage = recentProbes.length > 0
    ? Math.round((okCount / recentProbes.length) * 100)
    : isHealthy ? 100 : 0;

  const lastCheckTime = service.last_checked_at
    ? new Date(service.last_checked_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "No checks yet";

  return (
    <Card className="group relative flex flex-col justify-between rounded-[2rem] bg-emerald-950 text-white dark:bg-emerald-950 border border-emerald-900/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-700/80">
      <div>
        {/* Top bar with response time / target info */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{service.last_response_time_ms ? `${service.last_response_time_ms}ms` : "—"}</span>
              <span className="text-emerald-400/60 font-normal text-xs">/ {(service as any).timeout_sec || 5}s timeout</span>
            </div>
            <p className="text-xs font-semibold text-emerald-200/80 mt-0.5 truncate max-w-[180px]" title={service.name}>
              {service.name}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-900/80 border border-emerald-700/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
              {service.type}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Visible Progress Bar inspired by reference design */}
      <div className="my-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-emerald-200/70">
          <span>{probePercentage}% Uptime</span>
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="h-3 w-3 opacity-70" /> {lastCheckTime}
          </span>
        </div>

        {/* High visibility progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-emerald-900/90 p-0.5 border border-emerald-800/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHealthy
                ? "bg-gradient-to-r from-emerald-400 to-lime-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                : "bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            }`}
            style={{ width: `${Math.max(probePercentage, 6)}%` }}
          />
        </div>
      </div>

      {/* Footer link */}
      <div className="flex items-center justify-between pt-2 border-t border-emerald-900/60 text-xs">
        <span className="text-emerald-300/70 flex items-center gap-1">
          <Activity className="h-3 w-3" /> Interval: {service.check_interval_sec}s
        </span>
        <Link
          to={`/services/${service.id}`}
          className="inline-flex items-center gap-1 font-semibold text-lime-300 hover:text-lime-200 transition-colors"
        >
          Details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
