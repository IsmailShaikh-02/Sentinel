import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface IncidentPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

export function IncidentPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  isFetching = false,
}: IncidentPaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages || totalPages === 0;

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t border-border/40 text-xs text-muted-foreground">
      <div>
        <span>
          Showing page <strong className="text-foreground">{currentPage}</strong> of{" "}
          <strong className="text-foreground">{Math.max(1, totalPages)}</strong> ({totalItems}{" "}
          {totalItems === 1 ? "incident" : "incidents"})
        </span>
        {isFetching && <span className="ml-2 animate-pulse text-primary font-medium">Updating...</span>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage || isFetching}
          className="h-8 text-xs px-2.5"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage || isFetching}
          className="h-8 text-xs px-2.5"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
