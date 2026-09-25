import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ServiceHeader } from "@/components/service-detail/ServiceHeader";
import { ServiceDetailTabs, type ServiceTab } from "@/components/service-detail/ServiceDetailTabs";
import { StatusTab } from "@/components/service-detail/StatusTab";
import { AnalyticsTab } from "@/components/service-detail/AnalyticsTab";
import { IncidentsTab } from "@/components/service-detail/IncidentsTab";
import { SettingsTab } from "@/components/service-detail/SettingsTab";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useServiceDetail } from "@/hooks/useServiceDetail";
import { useManualCheck } from "@/hooks/useServiceMutations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab state synchronized with URL query param `?tab=status|analytics|incidents|settings`
  const activeTabParam = searchParams.get("tab") as ServiceTab | null;
  const activeTab: ServiceTab =
    activeTabParam && ["status", "analytics", "incidents", "settings"].includes(activeTabParam)
      ? activeTabParam
      : "status";

  const handleTabChange = (newTab: ServiceTab) => {
    setSearchParams({ tab: newTab }, { replace: true });
  };

  const { data: service, isLoading, isError, error, refetch } = useServiceDetail(id);
  const manualCheckMutation = useManualCheck();

  const handleManualCheck = async () => {
    if (!id) return;
    try {
      await manualCheckMutation.mutateAsync(id);
      refetch();
    } catch {
      // Error handled by mutation hook or notification
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-12 w-[480px]" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (isError || !service || !id) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/services")} className="gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            {error ? error.message : "The requested service monitor could not be found."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/services")}
          className="mb-3 gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Services
        </Button>

        <ServiceHeader
          service={service}
          onManualCheck={handleManualCheck}
          isChecking={manualCheckMutation.isPending}
        />
      </div>

      {/* URL Synchronized Tab Bar */}
      <ServiceDetailTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Panels */}
      <div>
        {activeTab === "status" && <StatusTab service={service} isActive={activeTab === "status"} />}
        {activeTab === "analytics" && <AnalyticsTab service={service} />}
        {activeTab === "incidents" && <IncidentsTab serviceId={service.id} />}
        {activeTab === "settings" && <SettingsTab service={service} />}
      </div>
    </div>
  );
}

export default ServiceDetailPage;
