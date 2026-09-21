import React, { useState, useEffect } from "react";
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
import { Loader2, AlertCircle } from "lucide-react";
import { useUpdateService } from "@/hooks/useServiceMutations";
import {
  updateServiceSchema,
  type Service,
  type HttpMethod,
} from "@/schemas/service.schema";

interface EditServiceModalProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditServiceModal({
  service,
  open,
  onOpenChange,
}: EditServiceModalProps) {
  const updateMutation = useUpdateService();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [expectedStatus, setExpectedStatus] = useState<number>(200);
  const [checkInterval, setCheckInterval] = useState<number>(60);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setName(service.name || "");
      setUrl(service.url || "");
      setMethod((service.method as HttpMethod) || "GET");
      setExpectedStatus(service.expected_status || 200);
      setCheckInterval(service.check_interval_sec || 60);
      setErrors({});
      setFormError(null);
    }
  }, [service]);

  if (!service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const payload = {
      name,
      url: service.type === "http" ? url : undefined,
      method: service.type === "http" ? method : undefined,
      expected_status: service.type === "http" ? expectedStatus : undefined,
      check_interval_sec: checkInterval,
    };

    const validation = updateServiceSchema.safeParse(payload);
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
      await updateMutation.mutateAsync({
        id: service.id,
        input: validation.data,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update service";
      setFormError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit Service Configuration</DialogTitle>
        <DialogDescription>
          Update parameters for <span className="font-semibold">{service.name}</span>.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Update Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Service Type (Immutable badge) */}
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Monitoring Type</Label>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded inline-block">
            {service.type}
          </div>
        </div>

        {/* Service Name */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">Service Name</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <p className="text-xs font-medium text-destructive">{errors.name}</p>
          )}
        </div>

        {/* HTTP specific fields */}
        {service.type === "http" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="edit-url">Target URL</Label>
              <Input
                id="edit-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {errors.url && (
                <p className="text-xs font-medium text-destructive">{errors.url}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-method">HTTP Method</Label>
                <select
                  id="edit-method"
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
                <Label htmlFor="edit-expectedStatus">Expected Status</Label>
                <Input
                  id="edit-expectedStatus"
                  type="number"
                  value={expectedStatus}
                  onChange={(e) => setExpectedStatus(Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}

        {/* Check Interval */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-checkInterval">Check Interval (Seconds)</Label>
          <Input
            id="edit-checkInterval"
            type="number"
            min={10}
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
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
