import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServiceIncidents } from "@/hooks/useServiceIncidents";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { IncidentDetailModal } from "@/components/incidents/IncidentDetailModal";
import type { Incident } from "@/schemas/incident.schema";
import { AlertCircle, Clock, ShieldAlert, CheckCircle2, ExternalLink } from "lucide-react";

interface IncidentsTabProps {
  serviceId: string;
}

export function IncidentsTab({ serviceId }: IncidentsTabProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const { data: incidents = [], isLoading, isError } = useServiceIncidents(serviceId);

  // Compute MTTR (Mean Time to Resolve) & metrics
  const resolvedIncidents = incidents.filter((inc) => inc.resolved_at);
  const totalResolutionMinutes = resolvedIncidents.reduce((acc, inc) => {
    const start = new Date(inc.started_at).getTime();
    const end = new Date(inc.resolved_at!).getTime();
    return acc + (end - start) / (1000 * 60);
  }, 0);

  const mttrMinutes =
    resolvedIncidents.length > 0 ? Math.round(totalResolutionMinutes / resolvedIncidents.length) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Total Incidents"
          value={incidents.length}
          icon={AlertCircle}
          variant="mint"
          subtext={`Active: ${incidents.filter((i) => !i.resolved_at).length}`}
        />

        <KPICard
          title="MTTR (Resolution Time)"
          value={mttrMinutes > 0 ? `${mttrMinutes} min` : "—"}
          icon={Clock}
          variant="teal"
          subtext={`Based on ${resolvedIncidents.length} resolved events`}
        />

        <KPICard
          title="Critical Outages"
          value={incidents.filter((i) => i.severity === "critical").length}
          icon={ShieldAlert}
          variant="default"
          subtext="High priority outage events"
        />
      </div>

      {/* Incident Log Table */}
      <Card className="rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl text-foreground p-0 shadow-md overflow-hidden">
        <CardHeader className="bg-white/40 dark:bg-white/10 border-b border-white/30 dark:border-white/10 p-5">
          <CardTitle className="text-base font-semibold text-foreground">Incident History Log</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Complete records of service outages, warnings, and detailed probe logs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-6 text-center text-sm text-destructive">Failed to load incident history.</div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-80" />
              <span>No incidents recorded for this service. Everything operating smoothly.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident: Incident) => {
                  const isResolved = Boolean(incident.resolved_at);
                  const startTime = new Date(incident.started_at).getTime();
                  const endTime = incident.resolved_at ? new Date(incident.resolved_at).getTime() : Date.now();
                  const durationMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));

                  return (
                    <TableRow key={incident.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <Badge
                          variant={isResolved ? "outline" : "destructive"}
                          className={
                            isResolved
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-destructive text-destructive-foreground animate-pulse"
                          }
                        >
                          {isResolved ? "RESOLVED" : "ACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            incident.severity === "critical"
                              ? "bg-destructive/10 text-destructive border-destructive/20 font-mono"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono"
                          }
                        >
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs max-w-xs truncate" title={incident.summary}>
                        {incident.summary}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(incident.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "Ongoing"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {durationMinutes < 60
                          ? `${durationMinutes}m`
                          : `${(durationMinutes / 60).toFixed(1)}h`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedIncidentId(incident.id)}
                          className="h-7 text-xs px-2.5"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" /> Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Incident Drill-Down Modal */}
      <IncidentDetailModal
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
      />
    </div>
  );
}
