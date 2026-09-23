import React from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
  isLoading?: boolean;
  variant?: "default" | "mint" | "teal";
  badge?: React.ReactNode;
  accentText?: string;
}

export function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  iconClassName,
  className,
  isLoading = false,
  variant = "default",
  badge,
  accentText,
}: KPICardProps) {
  const variantStyles = {
    default:
      "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl hover:border-white/80 dark:hover:border-white/20 hover:-translate-y-0.5",
    mint: "bg-emerald-500/10 dark:bg-emerald-950/30 backdrop-blur-xl text-emerald-950 dark:text-emerald-50 border border-emerald-500/30 dark:border-emerald-500/20 shadow-lg hover:shadow-xl hover:bg-emerald-500/15 hover:-translate-y-0.5",
    teal: "bg-gradient-to-br from-emerald-900/90 to-teal-950/90 backdrop-blur-xl text-white border border-emerald-500/40 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
  };

  const titleStyles = {
    default: "text-muted-foreground font-medium",
    mint: "text-emerald-800/80 dark:text-emerald-300 font-medium",
    teal: "text-emerald-200/80 font-medium",
  };

  const valueStyles = {
    default: "text-foreground",
    mint: "text-emerald-950 dark:text-emerald-50",
    teal: "text-white dark:text-emerald-50",
  };

  const iconContainerStyles = {
    default: "bg-muted/60 text-muted-foreground",
    mint: "bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200",
    teal: "bg-emerald-800/80 dark:bg-emerald-900/80 text-emerald-200",
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col justify-between rounded-[2rem] p-6 transition-all duration-300",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {accentText && (
            <p className="text-[11px] font-mono tracking-wider opacity-70 mb-1">
              {accentText}
            </p>
          )}
          <CardTitle className={cn("text-xs font-semibold tracking-wide uppercase", titleStyles[variant])}>
            {title}
          </CardTitle>
        </div>
        
        <div className="flex items-center gap-2">
          {badge && (
            <div className="inline-flex items-center rounded-full bg-white/70 dark:bg-black/30 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-xs">
              {badge}
            </div>
          )}
          {Icon && (
            <div className={cn("rounded-2xl p-2.5 transition-transform group-hover:scale-105", iconContainerStyles[variant])}>
              <Icon className={cn("h-4 w-4", iconClassName)} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-28 rounded-xl bg-current/15 animate-shimmer" />
            <div className="h-3.5 w-36 rounded-lg bg-current/10 animate-shimmer" />
          </div>
        ) : (
          <div className="animate-in fade-in-50 duration-300">
            <div className={cn("text-3xl font-extrabold tracking-tight font-sans", valueStyles[variant])}>
              {value}
            </div>
            {subtext && (
              <div className="text-xs opacity-80 mt-1.5 flex items-center gap-1.5 font-medium">
                {subtext}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
