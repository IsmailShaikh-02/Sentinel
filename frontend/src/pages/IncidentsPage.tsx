import { useState } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { IncidentFilters } from "@/components/incidents/IncidentFilters";
import { IncidentTable } from "@/components/incidents/IncidentTable";
import { IncidentPagination } from "@/components/incidents/IncidentPagination";
import { IncidentDetailModal } from "@/components/incidents/IncidentDetailModal";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export function IncidentsPage() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const {
    incidents,
    total,
    currentPage,
    totalPages,
    isLoading,
    isFetching,
    filters,
    setStatusFilter,
    setSeverityFilter,
    setSearchQuery,
    setPage,
    resetFilters,
  } = useIncidents();

  // Count active open incidents in current view
  const openIncidentsCount = incidents.filter((inc) => !inc.resolved_at).length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Incident Management
            </h1>
            {openIncidentsCount > 0 ? (
              <Badge variant="destructive" className="animate-pulse text-xs">
                <AlertTriangle className="mr-1 h-3 w-3 inline-block" />
                {openIncidentsCount} Active {openIncidentsCount === 1 ? "Incident" : "Incidents"}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
                All Systems Operational
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Browse, filter, and inspect detailed failure telemetry and chronological probe logs.
          </p>
        </div>
      </div>

      {/* Filters */}
      <IncidentFilters
        status={filters.status}
        severity={filters.severity}
        search={filters.search}
        onStatusChange={setStatusFilter}
        onSeverityChange={setSeverityFilter}
        onSearchChange={setSearchQuery}
        onReset={resetFilters}
      />

      {/* Incidents Table */}
      <div className="space-y-2">
        <IncidentTable
          incidents={incidents}
          isLoading={isLoading}
          onInspect={(id) => setSelectedIncidentId(id)}
        />

        {/* Pagination */}
        <IncidentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
          isFetching={isFetching}
        />
      </div>

      {/* Drill-down Modal */}
      <IncidentDetailModal
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
      />
    </div>
  );
}
