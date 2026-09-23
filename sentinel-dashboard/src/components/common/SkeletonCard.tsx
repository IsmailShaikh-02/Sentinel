import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <Card className={`relative overflow-hidden border-border/50 bg-card/60 shadow-xs ${className}`}>
      {/* Shimmer gradient overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent" />
      <CardHeader className="space-y-2 pb-4">
        <div className="h-4 w-1/3 rounded-md bg-muted/80" />
        <div className="h-3 w-1/2 rounded-md bg-muted/50" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-24 w-full rounded-lg bg-muted/40" />
        <div className="flex gap-2">
          <div className="h-8 w-1/2 rounded-md bg-muted/60" />
          <div className="h-8 w-1/2 rounded-md bg-muted/60" />
        </div>
      </CardContent>
    </Card>
  );
}
