import * as React from "react"
import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-auto rounded-[2.5rem] border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl p-2 sm:p-3 shadow-xl">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm border-separate border-spacing-y-1.5", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-white/80 dark:bg-slate-800/80 text-foreground uppercase text-[11px] font-bold tracking-wider backdrop-blur-md rounded-2xl shadow-xs border border-white/60 dark:border-white/10 [&_tr]:border-b-0 [&_tr]:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:nth-child(even)]:bg-white/60 dark:[&_tr:nth-child(even)]:bg-white/5 [&_tr:nth-child(odd)]:bg-white/40 dark:[&_tr:nth-child(odd)]:bg-white/[0.02]",
        className
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-white/60 dark:bg-white/10 font-medium [&>tr]:last:border-b-0 rounded-b-2xl backdrop-blur-md border-t border-white/50 dark:border-white/10",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-all duration-200 data-[state=selected]:bg-muted/50 group/row",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 text-left align-middle font-extrabold text-foreground/90 first:rounded-l-2xl last:rounded-r-2xl [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle first:rounded-l-2xl last:rounded-r-2xl text-foreground font-semibold border-y border-white/40 dark:border-white/5 first:border-l last:border-r transition-all duration-200 group-hover/row:bg-white/95 dark:group-hover/row:bg-white/15 group-hover/row:shadow-md [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
