import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, Globe, HeartPulse, AlertCircle } from "lucide-react";
import { useCreateService } from "@/hooks/useServiceMutations";
import { createServiceSchema, type HttpMethod } from "@/schemas/service.schema";

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateServiceModal({
  open,
  onOpenChange,
}: CreateServiceModalProps) {
  const createMutation = useCreateService();

  const [type, setType] = useState<"http" | "heartbeat">("http");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [expectedStatus, setExpectedStatus] = useState<number>(200);
  const [checkInterval, setCheckInterval] = useState<number>(60);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setType("http");
    setName("");
    setUrl("");
    setMethod("GET");
    setExpectedStatus(200);
    setCheckInterval(60);
    setErrors({});
    setFormError(null);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const payload = {
      name,
      type,
      url: type === "http" ? url : undefined,
      method: type === "http" ? method : undefined,
      expected_status: type === "http" ? expectedStatus : 200,
      check_interval_sec: checkInterval,
      enabled: true,
    };

    const validation = createServiceSchema.safeParse(payload);
    if (!validation.success) {
      const formattedErrors: { [key: string]: string } = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    try {
      await createMutation.mutateAsync(validation.data);
      handleClose(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create service";
      setFormError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle>Add Monitored Endpoint</DialogTitle>
        <DialogDescription>
          Configure an HTTP endpoint or heartbeat check to monitor service health.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Creation Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Service Type Selection */}
        <div className="space-y-2">
          <Label>Monitoring Mode</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("http")}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                type === "http"
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Globe className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">HTTP Polling</p>
                <p className="text-[10px] text-muted-foreground">Probe URL at interval</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType("heartbeat")}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                type === "heartbeat"
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <HeartPulse className="h-5 w-5 shrink-0 text-rose-500" />
              <div>
                <p className="text-xs font-semibold">Heartbeat</p>
                <p className="text-[10px] text-muted-foreground">Receive incoming checkins</p>
              </div>
            </button>
          </div>
        </div>

        {/* Service Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Service Name</Label>
          <Input
            id="name"
            placeholder="e.g. Production API Gateway"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <p className="text-xs font-medium text-destructive">{errors.name}</p>
          )}
        </div>

        {/* HTTP specific fields */}
        {type === "http" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                placeholder="https://api.example.com/health"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {errors.url && (
                <p className="text-xs font-medium text-destructive">{errors.url}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="method">HTTP Method</Label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
                >
                  <option value="GET" className="bg-card text-foreground">GET</option>
                  <option value="POST" className="bg-card text-foreground">POST</option>
                  <option value="HEAD" className="bg-card text-foreground">HEAD</option>
                  <option value="PUT" className="bg-card text-foreground">PUT</option>
                  <option value="DELETE" className="bg-card text-foreground">DELETE</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expectedStatus">Expected Status</Label>
                <Input
                  id="expectedStatus"
                  type="number"
                  placeholder="200"
                  value={expectedStatus}
                  onChange={(e) => setExpectedStatus(Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}

        {/* Check Interval */}
        <div className="space-y-1.5">
          <Label htmlFor="checkInterval">Check Interval (Seconds)</Label>
          <Input
            id="checkInterval"
            type="number"
            min={10}
            placeholder="60"
            value={checkInterval}
            onChange={(e) => setCheckInterval(Number(e.target.value))}
          />
          {errors.check_interval_sec && (
            <p className="text-xs font-medium text-destructive">
              {errors.check_interval_sec}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add Service"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
