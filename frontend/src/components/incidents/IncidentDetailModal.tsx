import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncidentDetail } from "@/hooks/useIncidentDetail";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export interface IncidentDetailModalProps {
  incidentId: string | null;
  onClose: () => void;
}

export function IncidentDetailModal({ incidentId, onClose }: IncidentDetailModalProps) {
  const { data: incident, isLoading, isError, error } = useIncidentDetail(incidentId);

  const isOpen = Boolean(incidentId);

  const isResolved = incident && Boolean(incident.resolved_at);

  const durationMinutes = incident
    ? incident.duration_minutes ??
      (incident.resolved_at
        ? Math.round(
            (new Date(incident.resolved_at).getTime() - new Date(incident.started_at).getTime()) / 60000
          )
        : Math.round((Date.now() - new Date(incident.started_at).getTime()) / 60000))
    : 0;

  const durationFormatted =
    durationMinutes < 60
      ? `${durationMinutes} minutes`
      : `${Math.floor(durationMinutes / 60)} hours ${durationMinutes % 60} mins`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Fetching incident drill-down telemetry...</p>
        </div>
      ) : isError || !incident ? (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Error Loading Incident
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {error?.message || "Failed to retrieve incident details."}
          </p>
          <DialogFooter>
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <div className="space-y-5">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <Badge
                variant={incident.severity === "critical" ? "destructive" : "warning"}
                className="capitalize text-xs"
              >
                {incident.severity === "critical" ? (
                  <ShieldAlert className="mr-1.5 h-3.5 w-3.5 inline-block" />
                ) : (
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5 inline-block" />
                )}
                {incident.severity} Severity
              </Badge>
              {isResolved ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3 inline-block" /> Resolved
                </Badge>
              ) : (
                <Badge variant="destructive" className="animate-pulse text-xs">
                  Active Incident
                </Badge>
              )}
            </div>
            <DialogTitle className="text-base font-bold text-foreground mt-2">
              {incident.summary}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Target Service: <span className="font-semibold text-foreground">{incident.service_name || incident.service_id}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium">Started At</span>
              <span className="font-semibold text-foreground">
                {new Date(incident.started_at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium">Resolved At</span>
              <span className="font-semibold text-foreground">
                {incident.resolved_at
                  ? new Date(incident.resolved_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Ongoing"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Total Downtime
              </span>
              <span className="font-semibold text-foreground font-mono">{durationFormatted}</span>
            </div>
          </div>

          {/* Failure probes / checks log timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Failure Window Probe Logs</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {incident.checks?.length || 0} probes recorded
              </span>
            </h4>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px] py-1.5">Timestamp</TableHead>
                    <TableHead className="text-[11px] py-1.5">Status Code</TableHead>
                    <TableHead className="text-[11px] py-1.5">Response Time</TableHead>
                    <TableHead className="text-[11px] py-1.5 text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!incident.checks || incident.checks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-xs text-muted-foreground">
                        No specific probe checks recorded during this incident window.
                      </TableCell>
                    </TableRow>
                  ) : (
                    incident.checks.map((check) => (
                      <TableRow key={check.id} className="text-xs">
                        <TableCell className="py-1.5 font-mono text-[11px]">
                          {new Date(check.checked_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-[11px]">
                          {check.status_code !== null ? (
                            <span
                              className={
                                check.ok
                                  ? "text-emerald-500 font-medium"
                                  : "text-destructive font-medium"
                              }
                            >
                              {check.status_code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">0 (Timeout)</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-[11px]">
                          {check.response_time_ms ? `${check.response_time_ms} ms` : "—"}
                        </TableCell>
                        <TableCell className="py-1.5 text-right">
                          {check.ok ? (
                            <span className="inline-flex items-center text-emerald-500 text-[11px] font-medium">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-destructive text-[11px] font-medium">
                              <XCircle className="mr-1 h-3 w-3" /> FAIL
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Close Details
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  );
}
