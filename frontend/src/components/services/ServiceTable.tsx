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
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EditServiceModal } from "@/components/services/EditServiceModal";
import { DeleteServiceDialog } from "@/components/services/DeleteServiceDialog";
import {
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
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-1 border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                        service.enabled
                          ? "bg-emerald-500 border-emerald-500 shadow-xs"
                          : "bg-neutral-300 dark:bg-neutral-700 border-neutral-400 dark:border-neutral-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                          service.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </TableCell>

                {/* Direct Action Buttons */}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {service.type === "http" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualCheck(service)}
                        disabled={manualCheckMutation.isPending && manualCheckMutation.variables === service.id}
                        className="h-8 text-xs px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10 rounded-lg"
                        title="Run check now"
                      >
                        {manualCheckMutation.isPending && manualCheckMutation.variables === service.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        )}
                        <span className="hidden sm:inline">Check</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingService(service)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                      title="Edit service"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingService(service)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Delete service"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
