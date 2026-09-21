import { useState } from "react";
import { Plus, Server, Activity, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Endpoints
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Polling
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Paused Checks
            </CardTitle>
            <PauseCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {pausedCount}
            </div>
          </CardContent>
        </Card>
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
