import { useState } from "react";
import { Plus, Server, Activity, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { ServiceTable } from "@/components/services/ServiceTable";
import { CreateServiceModal } from "@/components/services/CreateServiceModal";
import { useServices } from "@/hooks/useServices";

export function ServicesPage() {
  const { data: services = [], isLoading, isError, error } = useServices();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const totalCount = services.length;
  const activeCount = services.filter((s) => s.enabled).length;
  const pausedCount = services.filter((s) => !s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Monitored Services
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage HTTP endpoints and heartbeat check-in signals.
          </p>
        </div>

        <Button onClick={() => setCreateModalOpen(true)} className="gap-2 font-semibold shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </Button>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard
          title="Total Endpoints"
          value={totalCount}
          icon={Server}
          variant="mint"
          isLoading={isLoading}
          subtext="Configured targets"
        />

        <KPICard
          title="Active Polling"
          value={activeCount}
          icon={Activity}
          variant="teal"
          isLoading={isLoading}
          subtext="Enabled & scheduled probes"
        />

        <KPICard
          title="Paused Checks"
          value={pausedCount}
          icon={PauseCircle}
          variant="default"
          isLoading={isLoading}
          subtext="Monitoring disabled"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive font-medium">
          Failed to fetch services: {error?.message}
        </div>
      )}

      {/* Main Services Table */}
      <ServiceTable services={services} isLoading={isLoading} />

      {/* Modal for creating a new service */}
      <CreateServiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
