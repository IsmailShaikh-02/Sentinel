import { Badge } from "@/components/ui/badge";
import { Activity, PauseCircle, HeartPulse, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  enabled: boolean;
  type?: "http" | "heartbeat";
  lastCheckOk?: boolean | null;
}

export function StatusBadge({ enabled, type, lastCheckOk }: StatusBadgeProps) {
  if (!enabled) {
    return (
      <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
        <PauseCircle className="h-3 w-3" />
        <span>Paused</span>
      </Badge>
    );
  }

  if (lastCheckOk === false) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="destructive" className="gap-1 font-medium animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          <span>Failing</span>
        </Badge>
        {type === "heartbeat" && (
          <Badge variant="outline" className="gap-1 text-[11px] font-normal border-border">
            <HeartPulse className="h-3 w-3 text-rose-500" />
            <span>Heartbeat</span>
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="success" className="gap-1 font-medium">
        <Activity className="h-3 w-3 text-emerald-500" />
        <span>Healthy</span>
      </Badge>
      {type === "heartbeat" && (
        <Badge variant="outline" className="gap-1 text-[11px] font-normal border-border">
          <HeartPulse className="h-3 w-3 text-rose-500" />
          <span>Heartbeat</span>
        </Badge>
      )}
    </div>
  );
}
