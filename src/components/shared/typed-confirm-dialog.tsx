"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Destructive-action dialog: the button stays disabled until the user types the exact name. */
export function TypedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  actionLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  actionLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const matches = typed === confirmText;

  async function run() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTyped("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-1.5">
          <Label htmlFor="typed-confirm">
            Type <span className="font-mono font-semibold text-foreground">{confirmText}</span> to confirm
          </Label>
          <Input
            id="typed-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-10"
          />
        </div>
        <DialogFooter>
          <Button variant="destructive" disabled={!matches || loading} onClick={run}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Working…
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
