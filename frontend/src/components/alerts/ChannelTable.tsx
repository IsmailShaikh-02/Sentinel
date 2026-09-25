import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import type { AlertChannel } from "@/schemas/channel.schema";
import { Mail, Send, Loader2, CheckCircle2 } from "lucide-react";

export interface ChannelTableProps {
  channels: AlertChannel[];
  isLoading?: boolean;
  onTest: (id: string) => Promise<void>;
  isTesting?: boolean;
  testingId?: string;
}

export function ChannelTable({
  channels,
  isLoading = false,
  onTest,
  isTesting = false,
  testingId,
}: ChannelTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Recipient Destination</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableSkeleton columns={5} rows={2} />
        ) : channels.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-xs">
              <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                <Mail className="h-6 w-6 text-muted-foreground/60" />
                <span className="font-medium text-foreground">No Alert Recipients Configured</span>
                <span>Your registered account email will appear here automatically.</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          channels.map((channel) => {
            const email = channel.config?.email || "—";
            const isCurrentTesting = isTesting && testingId === channel.id;
            const formattedDate = channel.created_at
              ? new Date(channel.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";

            return (
              <TableRow key={channel.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                    <Mail className="mr-1 h-3 w-3 inline-block text-primary" /> {channel.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-xs text-foreground font-mono">
                  {email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px]">
                    <CheckCircle2 className="mr-1 h-3 w-3 inline-block" /> Active
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formattedDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTest(channel.id)}
                      disabled={isCurrentTesting}
                      className="h-7 text-xs px-2.5 gap-1.5"
                    >
                      {isCurrentTesting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-primary" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 text-primary" /> Test via Brevo
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
