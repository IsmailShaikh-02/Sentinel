import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Incident } from "@/schemas/incident.schema";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Activity, AlertCircle } from "lucide-react";

export interface RecentIncidentsTableProps {
  incidents: Incident[];
  isLoading?: boolean;
}

export function RecentIncidentsTable({ incidents, isLoading = false }: RecentIncidentsTableProps) {
  const topIncidents = incidents.slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> Recent System Incidents
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active outages, performance degradation markers, and resolved event history.
          </p>
        </div>

        <Link
          to="/incidents"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200 border border-emerald-500/20 hover:bg-emerald-200 transition-colors shrink-0 whitespace-nowrap"
        >
          View all incidents <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Styled Table matching ui/table.tsx theme */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service Target</TableHead>
            <TableHead>Incident Summary</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Started At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell><div className="h-4 w-28 bg-muted/80 rounded animate-shimmer" /></TableCell>
                <TableCell><div className="h-4 w-56 bg-muted/80 rounded animate-shimmer" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted/80 rounded animate-shimmer" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted/80 rounded animate-shimmer" /></TableCell>
                <TableCell className="text-right"><div className="h-4 w-24 bg-muted/80 rounded ml-auto animate-shimmer" /></TableCell>
              </TableRow>
            ))
          ) : topIncidents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> No active or recent system incidents recorded.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            topIncidents.map((incident) => {
              const isOpen = !incident.resolved_at;
              const formattedDate = new Date(incident.started_at).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <TableRow key={incident.id} className="cursor-pointer">
                  <TableCell className="font-semibold text-foreground text-xs">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>{incident.service_name || incident.service_id.slice(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground/90 max-w-xs truncate" title={incident.summary}>
                    {incident.summary}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={incident.severity === "critical" ? "destructive" : "warning"}
                      className="text-[11px] font-semibold capitalize"
                    >
                      {incident.severity === "critical" ? (
                        <ShieldAlert className="mr-1 h-3 w-3 inline-block" />
                      ) : (
                        <AlertCircle className="mr-1 h-3 w-3 inline-block" />
                      )}
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isOpen ? (
                      <Badge variant="destructive" className="animate-pulse text-[11px] font-semibold">
                        Open
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-muted-foreground font-medium">
                        Resolved
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground font-medium">
                    {formattedDate}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
