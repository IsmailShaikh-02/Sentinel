import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateService, useDeleteService } from "@/hooks/useServiceMutations";
import type { Service } from "@/schemas/service.schema";
import { Save, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SettingsTabProps {
  service: Service;
}

export function SettingsTab({ service }: SettingsTabProps) {
  const navigate = useNavigate();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [name, setName] = useState(service.name);
  const [url, setUrl] = useState(service.url || "");
  const [method, setMethod] = useState(service.method || "GET");
  const [expectedStatus, setExpectedStatus] = useState(service.expected_status || 200);
  const [checkIntervalSec, setCheckIntervalSec] = useState(service.check_interval_sec || 60);
  const [enabled, setEnabled] = useState(service.enabled);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await updateServiceMutation.mutateAsync({
        id: service.id,
        input: {
          name,
          url: service.type === "http" ? url : undefined,
          method: service.type === "http" ? method : undefined,
          expected_status: Number(expectedStatus),
          check_interval_sec: Number(checkIntervalSec),
          enabled,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update service");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteServiceMutation.mutateAsync(service.id);
      navigate("/services");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete service");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {saveSuccess && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Service configuration saved successfully.</AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Main Configuration Card */}
      <Card className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl overflow-hidden">
        <CardHeader className="mb-2 border-b border-black/5 dark:border-white/10 pb-5">
          <CardTitle className="text-base font-semibold text-foreground">
            Service Configuration
          </CardTitle>
          <CardDescription className="mt-1 text-xs text-muted-foreground">
            Modify probe target settings, check interval frequency, and status thresholds
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-name" className="text-foreground font-medium">
                  Service Name
                </Label>
                <Input
                  id="service-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Auth Gateway API"
                  required
                  className="bg-white/50 dark:bg-slate-950/50 border-white/40 dark:border-white/10 text-foreground rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check-interval" className="text-foreground font-medium">
                  Check Interval (seconds)
                </Label>
                <Input
                  id="check-interval"
                  type="number"
                  min={10}
                  value={checkIntervalSec}
                  onChange={(e) => setCheckIntervalSec(Number(e.target.value))}
                  required
                  className="bg-white/50 dark:bg-slate-950/50 border-white/40 dark:border-white/10 text-foreground rounded-xl"
                />
              </div>
            </div>

            {service.type === "http" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="service-url" className="text-foreground font-medium">
                    Target Endpoint URL
                  </Label>
                  <Input
                    id="service-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/health"
                    required
                    className="bg-white/50 dark:bg-slate-950/50 border-white/40 dark:border-white/10 text-foreground rounded-xl"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="http-method" className="text-foreground font-medium">
                      HTTP Method
                    </Label>
                    <select
                      id="http-method"
                      value={method}
                      onChange={(e) => setMethod(e.target.value as any)}
                      className="flex h-10 w-full rounded-xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="HEAD">HEAD</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected-status" className="text-foreground font-medium">
                      Expected HTTP Status Code
                    </Label>
                    <Input
                      id="expected-status"
                      type="number"
                      min={100}
                      max={599}
                      value={expectedStatus}
                      onChange={(e) => setExpectedStatus(Number(e.target.value))}
                      required
                      className="bg-white/50 dark:bg-slate-950/50 border-white/40 dark:border-white/10 text-foreground rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Enable / Disable Monitoring */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4 backdrop-blur-md">
              <div className="space-y-1">
                <Label
                  htmlFor="active-probing"
                  className="text-sm font-semibold text-foreground cursor-pointer"
                >
                  Enable Active Probing
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pause or resume automatic health check requests for this service
                </p>
              </div>

              <Switch
                id="active-probing"
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(checked)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-black/5 dark:border-white/10 pt-4">
            <Button
              type="submit"
              disabled={updateServiceMutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md"
            >
              <Save className="h-4 w-4" />
              {updateServiceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-[2.5rem] border border-red-500/30 bg-red-500/5 dark:bg-red-950/20 backdrop-blur-xl p-2 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Permanently delete this service monitor and all associated check logs and incidents.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Delete Service Monitor</p>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>

          <div>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              <Trash2 className="h-4 w-4" />
              Delete Service
            </Button>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete <strong>{service.name}</strong> and all associated historical analytics and incident records.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteServiceMutation.isPending}
                >
                  {deleteServiceMutation.isPending ? "Deleting..." : "Yes, Delete Service"}
                </Button>
              </DialogFooter>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
