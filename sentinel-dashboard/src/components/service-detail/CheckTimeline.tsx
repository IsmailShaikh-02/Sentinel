import type { Check } from "@/schemas/check.schema";

interface CheckTimelineProps {
  checks: Check[];
}

export function CheckTimeline({ checks }: CheckTimelineProps) {
  // Display last 10-20 checks horizontally
  const displayChecks = checks.slice(0, 15).reverse();

  if (displayChecks.length === 0) {
    return (
      <div className="flex items-center gap-1.5 py-2 text-xs text-muted-foreground">
        No recent probe data available
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-2">
      {displayChecks.map((check) => {
        const isOk = check.ok;
        const formattedTime = new Date(check.checked_at).toLocaleTimeString();
        const tooltip = `${isOk ? "200 OK" : check.status_code || "Failed"} (${check.response_time_ms ?? 0}ms) at ${formattedTime}`;

        return (
          <div
            key={check.id}
            title={tooltip}
            className={`h-6 w-2.5 rounded-full transition-all duration-200 hover:scale-125 ${
              isOk ? "bg-emerald-500 shadow-sm shadow-emerald-500/20" : "bg-destructive shadow-sm shadow-destructive/20"
            }`}
          />
        );
      })}
    </div>
  );
}
