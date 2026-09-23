import { ServiceHealthCard } from "@/components/dashboard/ServiceHealthCard";
import type { Service } from "@/schemas/service.schema";
import { ServerOff } from "lucide-react";

export interface ServiceHealthGridProps {
  services: Service[];
  isLoading?: boolean;
}

export function ServiceHealthGrid({ services, isLoading = false }: ServiceHealthGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse transition-all duration-300"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-muted/80 rounded animate-shimmer" />
              <div className="h-4 w-12 bg-muted/80 rounded animate-shimmer" />
            </div>
            <div className="h-3 w-full bg-muted/60 rounded animate-shimmer" />
            <div className="h-2 w-full bg-muted/60 rounded animate-shimmer" />
            <div className="h-4 w-24 bg-muted/40 rounded animate-shimmer mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center bg-card/50">
        <ServerOff className="h-8 w-8 text-muted-foreground mb-2" />
        <h3 className="font-semibold text-foreground text-sm">No Services Registered</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add services in the Services tab to begin active telemetry monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-50 duration-300">
      {services.map((service) => (
        <ServiceHealthCard key={service.id} service={service} />
      ))}
    </div>
  );
}
