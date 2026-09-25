import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Service } from "@/schemas/service.schema";
import { Play, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

interface ServiceHeaderProps {
  service: Service;
  onManualCheck: () => void;
  isChecking: boolean;
}

export function ServiceHeader({ service, onManualCheck, isChecking }: ServiceHeaderProps) {
  const isHealthy = service.last_check_ok ?? service.enabled;

  return (
    <div className="flex flex-col gap-4 rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-7 shadow-lg transition-all md:flex-row md:items-center md:justify-between text-foreground">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{service.name}</h1>

          {/* Status Badge */}
          <Badge
            variant={isHealthy ? "outline" : "destructive"}
            className={
              isHealthy
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-full px-3 py-1 font-semibold"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 rounded-full px-3 py-1 font-semibold"
            }
          >
            {isHealthy ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Operational
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Degraded / Outage
              </span>
            )}
          </Badge>

          {/* Service Type Pill */}
          <Badge variant="secondary" className="uppercase font-mono text-[10px] tracking-wider bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/10 rounded-full px-2.5 py-0.5 text-foreground">
            {service.type}
          </Badge>
        </div>

        {service.url && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono text-xs text-foreground bg-white/80 dark:bg-white/20 px-2.5 py-0.5 rounded-full font-semibold border border-white/40">{service.method || "GET"}</span>
            <a
              href={service.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline transition-colors font-mono text-xs"
            >
              {service.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 md:pt-0">
        <Button
          onClick={onManualCheck}
          disabled={isChecking}
          variant="outline"
          className="relative gap-2 rounded-full border border-white/50 dark:border-white/20 bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 text-xs font-semibold px-5 py-2.5 transition-all shadow-sm backdrop-blur-md text-foreground disabled:opacity-80"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="animate-pulse">Executing Probe...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
              <span>Run Manual Check</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
