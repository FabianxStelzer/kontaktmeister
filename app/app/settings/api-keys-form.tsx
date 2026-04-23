"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Key, Trash2 } from "lucide-react";
import { saveHeygenKey, removeHeygenKey } from "./actions";
import { useRouter } from "next/navigation";

export function ApiKeysForm({
  hasHeygenKey,
  heygenLabel,
}: {
  hasHeygenKey: boolean;
  heygenLabel: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(!hasHeygenKey);

  if (hasHeygenKey && !editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <div className="font-medium">HeyGen-Key hinterlegt</div>
            <div className="text-sm text-muted-foreground">
              {heygenLabel ?? "Standard"} &middot; verschluesselt gespeichert
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Ersetzen
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              if (!confirm("Key wirklich loeschen?")) return;
              start(async () => {
                await removeHeygenKey();
                router.refresh();
              });
            }}
            disabled={pending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        start(async () => {
          await saveHeygenKey(fd);
          setEditing(false);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="key">HeyGen API-Key</Label>
        <Input id="key" name="key" type="password" required placeholder="hg_xxx..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="label">Bezeichnung (optional)</Label>
        <Input id="label" name="label" placeholder="z.B. Produktions-Key" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          <Key className="mr-2 h-4 w-4" /> Speichern
        </Button>
        {hasHeygenKey && (
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}
