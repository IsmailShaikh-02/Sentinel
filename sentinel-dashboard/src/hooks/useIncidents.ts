import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { incidentsApi } from "@/api/incidents";
import type { IncidentListResponse } from "@/schemas/incident.schema";

export function useIncidents() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status") || "all";
  const severity = searchParams.get("severity") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 10;

  const queryParams = {
    status: status !== "all" ? status : undefined,
    severity: severity !== "all" ? severity : undefined,
    page: isNaN(page) || page < 1 ? 1 : page,
    limit,
  };

  const query = useQuery<IncidentListResponse, Error>({
    queryKey: ["incidents", status, severity, queryParams.page, limit],
    queryFn: async () => {
      const result = await incidentsApi.getIncidents(queryParams);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 10000,
  });

  const updateParams = (newParams: Record<string, string | number | undefined>) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === undefined || val === "" || val === "all") {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      return updated;
    });
  };

  const setStatusFilter = (newStatus: string) => {
    updateParams({ status: newStatus, page: 1 });
  };

  const setSeverityFilter = (newSeverity: string) => {
    updateParams({ severity: newSeverity, page: 1 });
  };

  const setSearchQuery = (newSearch: string) => {
    updateParams({ search: newSearch, page: 1 });
  };

  const setPage = (newPage: number) => {
    updateParams({ page: newPage });
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  // Filter client-side by search query if provided (e.g. summary or service name matching)
  const rawIncidents = query.data?.incidents || [];
  const filteredIncidents = search.trim()
    ? rawIncidents.filter(
        (inc) =>
          inc.summary.toLowerCase().includes(search.toLowerCase()) ||
          (inc.service_name && inc.service_name.toLowerCase().includes(search.toLowerCase())) ||
          inc.service_id.toLowerCase().includes(search.toLowerCase())
      )
    : rawIncidents;

  return {
    ...query,
    incidents: filteredIncidents,
    total: query.data?.total || 0,
    currentPage: queryParams.page,
    totalPages: query.data?.totalPages || 1,
    filters: {
      status,
      severity,
      search,
      page: queryParams.page,
    },
    setStatusFilter,
    setSeverityFilter,
    setSearchQuery,
    setPage,
    resetFilters,
  };
}
