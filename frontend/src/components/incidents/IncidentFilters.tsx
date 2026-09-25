import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Filter } from "lucide-react";

export interface IncidentFiltersProps {
  status: string;
  severity: string;
  search: string;
  onStatusChange: (status: string) => void;
  onSeverityChange: (severity: string) => void;
  onSearchChange: (search: string) => void;
  onReset: () => void;
}

export function IncidentFilters({
  status,
  severity,
  search,
  onStatusChange,
  onSeverityChange,
  onSearchChange,
  onReset,
}: IncidentFiltersProps) {
  const isFiltered = status !== "all" || severity !== "all" || search.trim() !== "";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-md">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by summary or service..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" /> Status:
          </span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open Only</option>
            <option value="resolved">Resolved Only</option>
          </select>
        </div>

        {/* Severity Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Severity:</span>
          <select
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground h-9"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
