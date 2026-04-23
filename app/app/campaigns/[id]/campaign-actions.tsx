"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play, Trash2 } from "lucide-react";
import type { CampaignStatus } from "@prisma/client";
import { startCampaign, pauseCampaign, deleteCampaign } from "../actions";

export function CampaignActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2">
      {status !== "RUNNING" && status !== "DONE" && (
        <Button
          onClick={() =>
            start(async () => {
              await startCampaign(campaignId);
              router.refresh();
            })
          }
          disabled={pending}
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          {status === "DRAFT" ? "Kampagne starten" : "Fortsetzen"}
        </Button>
      )}
      {status === "RUNNING" && (
        <Button
          variant="outline"
          onClick={() =>
            start(async () => {
              await pauseCampaign(campaignId);
              router.refresh();
            })
          }
          disabled={pending}
        >
          <Pause className="mr-2 h-4 w-4" /> Pausieren
        </Button>
      )}
      <Button
        variant="destructive"
        onClick={() =>
          start(async () => {
            if (!confirm("Kampagne und alle zugehoerigen Daten loeschen?")) return;
            await deleteCampaign(campaignId);
          })
        }
        disabled={pending}
      >
        <Trash2 className="mr-2 h-4 w-4" /> Loeschen
      </Button>
    </div>
  );
}
