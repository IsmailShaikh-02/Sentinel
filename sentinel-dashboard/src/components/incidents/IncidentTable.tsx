import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IncidentRow } from "@/components/incidents/IncidentRow";
import type { Incident } from "@/schemas/incident.schema";
import { AlertCircle } from "lucide-react";

export interface IncidentTableProps {
  incidents: Incident[];
  isLoading?: boolean;
  onInspect: (id: string) => void;
}

export function IncidentTable({ incidents, isLoading = false, onInspect }: IncidentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead>Summary</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Opened At</TableHead>
          <TableHead>Resolved At</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell className="text-right"><div className="h-7 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
            </TableRow>
          ))
        ) : incidents.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
              <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
                <span className="font-medium text-foreground">No Incidents Found</span>
                <span className="text-xs">No incidents match the active filter criteria.</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} onInspect={onInspect} />
          ))
        )}
      </TableBody>
    </Table>
  );
}
