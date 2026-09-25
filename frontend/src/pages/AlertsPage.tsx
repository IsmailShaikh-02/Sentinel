import { useState } from "react";
import { useAlertHistory } from "@/hooks/useAlertHistory";
import { AlertHistoryTable } from "@/components/alerts/AlertHistoryTable";
import { KPICard } from "@/components/dashboard/KPICard";
import { Mail, Send, ShieldCheck, History } from "lucide-react";

export function AlertsPage() {
  const [historyPage] = useState(1);

  const { data: historyData, isLoading: isHistoryLoading } = useAlertHistory(historyPage);

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Alerts & Notification History
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor transactional email delivery status and inspect historical outage dispatch logs.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Notification Method"
          value="Email Alert"
          icon={Mail}
          variant="mint"
          isLoading={false}
          subtext="Sent to registered user email"
        />

        <KPICard
          title="Delivery Provider"
          value="Transactional Mail"
          icon={Send}
          variant="teal"
          subtext={
            <span className="text-emerald-300 font-medium">High-deliverability SMTP Engine</span>
          }
        />

        <KPICard
          title="Total Dispatches"
          value={historyData?.total ?? 0}
          icon={ShieldCheck}
          variant="default"
          isLoading={isHistoryLoading}
          subtext="Deduplicated outage notifications sent"
        />
      </div>

      {/* Audit Trail Log Section */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-amber-500" /> Email Delivery Audit Log
          </h2>
          <p className="text-xs text-muted-foreground">
            Historical ledger of all incident notifications dispatched via transactional email.
          </p>
        </div>

        <AlertHistoryTable
          alerts={historyData?.alerts || []}
          isLoading={isHistoryLoading}
        />
      </div>
    </div>
  );
}

export default AlertsPage;
