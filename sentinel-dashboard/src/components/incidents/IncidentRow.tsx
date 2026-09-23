import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Incident } from "@/schemas/incident.schema";
import { ExternalLink, ShieldAlert, AlertTriangle } from "lucide-react";

export interface IncidentRowProps {
  incident: Incident;
  onInspect: (id: string) => void;
}

export function IncidentRow({ incident, onInspect }: IncidentRowProps) {
  const isOpen = !incident.resolved_at;

  const startedAt = new Date(incident.started_at).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const resolvedAt = incident.resolved_at
    ? new Date(incident.resolved_at).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // Calculate duration in minutes if not provided directly
  const durationMinutes =
    incident.duration_minutes !== undefined && incident.duration_minutes !== null
      ? incident.duration_minutes
      : incident.resolved_at
      ? Math.round(
          (new Date(incident.resolved_at).getTime() - new Date(incident.started_at).getTime()) / 60000
        )
      : Math.round((Date.now() - new Date(incident.started_at).getTime()) / 60000);

  const durationFormatted =
    durationMinutes < 60
      ? `${durationMinutes}m`
      : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      <TableCell className="font-medium text-xs text-foreground">
        <div className="flex flex-col">
          <span>{incident.service_name || "Unknown Service"}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{incident.service_id.slice(0, 8)}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs text-foreground max-w-sm truncate" title={incident.summary}>
        {incident.summary}
      </TableCell>
      <TableCell>
        <Badge
          variant={incident.severity === "critical" ? "destructive" : "warning"}
          className="text-[11px] capitalize"
        >
          {incident.severity === "critical" ? (
            <ShieldAlert className="mr-1 h-3 w-3 inline-block" />
          ) : (
            <AlertTriangle className="mr-1 h-3 w-3 inline-block" />
          )}
          {incident.severity}
        </Badge>
      </TableCell>
      <TableCell>
        {isOpen ? (
          <Badge variant="destructive" className="animate-pulse text-[11px]">
            Open
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[11px] text-muted-foreground border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            Resolved
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{startedAt}</TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{resolvedAt}</TableCell>
      <TableCell className="text-xs font-mono text-muted-foreground">{isOpen ? `Ongoing (${durationFormatted})` : durationFormatted}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onInspect(incident.id)}
          className="h-7 text-xs px-2.5"
        >
          <ExternalLink className="mr-1 h-3 w-3" /> Inspect
        </Button>
      </TableCell>
    </TableRow>
  );
}
