import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import type { AlertHistoryItem } from "@/schemas/channel.schema";
import { ShieldAlert, CheckCircle2, History } from "lucide-react";

export interface AlertHistoryTableProps {
  alerts: AlertHistoryItem[];
  isLoading?: boolean;
}

export function AlertHistoryTable({ alerts, isLoading = false }: AlertHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Incident ID</TableHead>
          <TableHead>Recipient Email</TableHead>
          <TableHead>Transition Type</TableHead>
          <TableHead>Dispatched At</TableHead>
          <TableHead className="text-right">Delivery Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableSkeleton columns={5} rows={4} />
        ) : alerts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-xs">
              <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                <History className="h-6 w-6 text-muted-foreground/60" />
                <span className="font-medium text-foreground">No Alert Dispatches Recorded</span>
                <span>Transactional outage logs will appear here automatically when incidents occur.</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          alerts.map((alert) => {
            const isOpening = alert.alert_type === "OPEN";
            const isSent = alert.status === "sent";
            const formattedDate = new Date(alert.sent_at).toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <TableRow key={alert.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {alert.incident_id.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-mono text-xs font-medium text-foreground">
                  {alert.recipient}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isOpening ? "destructive" : "outline"}
                    className={
                      isOpening
                        ? "animate-pulse text-[11px]"
                        : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px]"
                    }
                  >
                    {isOpening ? (
                      <ShieldAlert className="mr-1 h-3 w-3 inline-block" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-3 w-3 inline-block" />
                    )}
                    {alert.alert_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formattedDate}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={isSent ? "success" : "destructive"}
                    className="capitalize text-[11px]"
                  >
                    {alert.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
