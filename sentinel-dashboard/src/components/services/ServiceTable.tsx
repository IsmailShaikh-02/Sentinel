import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EditServiceModal } from "@/components/services/EditServiceModal";
import { DeleteServiceDialog } from "@/components/services/DeleteServiceDialog";
import {
  MoreVertical,
  Play,
  Pencil,
  Trash2,
  Globe,
  HeartPulse,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useUpdateService, useManualCheck } from "@/hooks/useServiceMutations";
import type { Service } from "@/schemas/service.schema";

interface ServiceTableProps {
  services: Service[];
  isLoading: boolean;
}

export function ServiceTable({ services, isLoading }: ServiceTableProps) {
  const navigate = useNavigate();
  const updateMutation = useUpdateService();
  const manualCheckMutation = useManualCheck();

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [checkSuccessMsg, setCheckSuccessMsg] = useState<string | null>(null);

  const handleToggleEnabled = (service: Service) => {
    updateMutation.mutate({
      id: service.id,
      input: { enabled: !service.enabled },
    });
  };

  const handleManualCheck = async (service: Service) => {
    try {
      const result = await manualCheckMutation.mutateAsync(service.id);
      setCheckSuccessMsg(
        `Check finished for ${service.name}: ${result.ok ? "OK" : "Failed"}${
          result.statusCode ? ` (${result.statusCode})` : ""
        }${result.responseTimeMs ? ` in ${result.responseTimeMs}ms` : ""}`
      );
      setTimeout(() => setCheckSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Manual check failed";
      setCheckSuccessMsg(`Check failed: ${msg}`);
      setTimeout(() => setCheckSuccessMsg(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading monitored endpoints...</span>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <Globe className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No endpoints monitored</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Get started by adding your first HTTP endpoint or heartbeat service to begin real-time monitoring.
        </p>
      </div>
    );
  }

  return (
    <>
      {checkSuccessMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{checkSuccessMsg}</span>
        </div>
      )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target Endpoint / Key</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow
                key={service.id}
                onClick={() => navigate(`/services/${service.id}`)}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {/* Service Name */}
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    {service.type === "http" ? (
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <HeartPulse className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <span className="hover:underline hover:text-primary transition-colors">
                      {service.name}
                    </span>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {service.type}
                  </span>
                </TableCell>

                {/* Target */}
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[240px] truncate">
                  {service.type === "http"
                    ? service.url || "—"
                    : service.heartbeat_key
                    ? `••••${service.heartbeat_key.slice(-6)}`
                    : "—"}
                </TableCell>

                {/* Interval */}
                <TableCell className="text-xs text-muted-foreground font-medium">
                  {service.check_interval_sec}s
                </TableCell>

                {/* Status & Toggle */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      enabled={service.enabled}
                      type={service.type}
                      lastCheckOk={service.last_check_ok}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleEnabled(service);
                      }}
                      title={service.enabled ? "Disable monitoring" : "Enable monitoring"}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        service.enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          service.enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="right">
                      {service.type === "http" && (
                        <DropdownMenuItem onClick={() => handleManualCheck(service)}>
                          <Play className="mr-2 h-3.5 w-3.5 text-primary" />
                          <span>Run Check Now</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setEditingService(service)}>
                        <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingService(service)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      <EditServiceModal
        service={editingService}
        open={Boolean(editingService)}
        onOpenChange={(open) => !open && setEditingService(null)}
      />

      <DeleteServiceDialog
        service={deletingService}
        open={Boolean(deletingService)}
        onOpenChange={(open) => !open && setDeletingService(null)}
      />
    </>
  );
}
