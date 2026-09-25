import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createChannelSchema } from "@/schemas/channel.schema";
import { Mail, Loader2 } from "lucide-react";

export interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddChannelModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddChannelModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = createChannelSchema.safeParse({ type: "email", email });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue?.message || "Invalid email address");
      return;
    }

    try {
      await onSubmit(email);
      setEmail("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add email recipient";
      setError(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Mail className="h-4 w-4 text-primary" /> Add Alert Email Recipient
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter a destination email address to receive Brevo transactional alerts when outages occur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="channel-email" className="text-xs font-medium">
            Destination Email Address
          </Label>
          <Input
            id="channel-email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            className="text-xs"
          />
          {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Adding...
              </>
            ) : (
              "Add Recipient"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
