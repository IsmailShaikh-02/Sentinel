import { useState } from "react";
import { useAlertChannels } from "@/hooks/useAlertChannels";
import { useAlertHistory } from "@/hooks/useAlertHistory";
import { ChannelTable } from "@/components/alerts/ChannelTable";
import { AddChannelModal } from "@/components/alerts/AddChannelModal";
import { AlertHistoryTable } from "@/components/alerts/AlertHistoryTable";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Plus, Send, ShieldCheck, History } from "lucide-react";

export function AlertsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [historyPage] = useState(1);

  const {
    channels,
    isLoading: isChannelsLoading,
    createChannel,
    isCreating,
    testChannel,
    isTesting,
    testingId,
    deleteChannel,
    isDeleting,
  } = useAlertChannels();

  const { data: historyData, isLoading: isHistoryLoading } = useAlertHistory(historyPage);

  const handleAddSubmit = async (email: string) => {
    await createChannel({ type: "email", email });
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Alerts & Notification Channels
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage email delivery destinations powered by Brevo transactional mail API and inspect outage dispatch logs.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto h-9 text-xs gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Recipient Email
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Configured Destinations"
          value={channels.length}
          icon={Mail}
          variant="mint"
          isLoading={isChannelsLoading}
          subtext="Active transactional email endpoints"
        />

        <KPICard
          title="Email Provider"
          value="Brevo API"
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

      {/* Recipient Channels Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Alert Email Destinations
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure recipient email addresses that receive atomic OPEN and RESOLVE notifications.
            </p>
          </div>
        </div>

        <ChannelTable
          channels={channels}
          isLoading={isChannelsLoading}
          onTest={async (id) => {
            await testChannel(id);
          }}
          onDelete={async (id) => {
            await deleteChannel(id);
          }}
          isTesting={isTesting}
          testingId={typeof testingId === "string" ? testingId : undefined}
          isDeleting={isDeleting}
        />
      </div>

      {/* Audit Trail Log Section */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-amber-500" /> Brevo Delivery Audit Log
          </h2>
          <p className="text-xs text-muted-foreground">
            Historical ledger of all incident notifications dispatched via Brevo transactional mail.
          </p>
        </div>

        <AlertHistoryTable
          alerts={historyData?.alerts || []}
          isLoading={isHistoryLoading}
        />
      </div>

      {/* Modal */}
      <AddChannelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        isSubmitting={isCreating}
      />
    </div>
  );
}

export default AlertsPage;
