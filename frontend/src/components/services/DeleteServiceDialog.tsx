import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useDeleteService } from "@/hooks/useServiceMutations";
import type { Service } from "@/schemas/service.schema";

interface DeleteServiceDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteServiceDialog({
  service,
  open,
  onOpenChange,
}: DeleteServiceDialogProps) {
  const deleteMutation = useDeleteService();

  if (!service) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(service.id);
      onOpenChange(false);
    } catch {
      // Handled by optimistic rollback & mutation error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <DialogTitle>Delete Service</DialogTitle>
        </div>
        <DialogDescription>
          Are you sure you want to delete <span className="font-semibold">{service.name}</span>?
          This action will stop active monitoring and cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={deleteMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete Service"
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
