import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import type { CampaignStatus } from "@prisma/client";

export const metadata = { title: "Kampagnen" };

const STATUS_VARIANT: Record<CampaignStatus, "secondary" | "default" | "warning" | "success" | "destructive"> = {
  DRAFT: "secondary",
  SCHEDULED: "warning",
  RUNNING: "default",
  PAUSED: "warning",
  DONE: "success",
  FAILED: "destructive",
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Entwurf",
  SCHEDULED: "Geplant",
  RUNNING: "Laeuft",
  PAUSED: "Pausiert",
  DONE: "Abgeschlossen",
  FAILED: "Fehler",
};

export default async function CampaignsPage() {
  const ctx = await requireWorkspace();
  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId: ctx.workspaceId },
    include: { _count: { select: { campaignContacts: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kampagnen</h1>
          <p className="text-sm text-muted-foreground">
            {campaigns.length} Kampagne{campaigns.length === 1 ? "" : "n"}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/campaigns/new">
            <Plus className="mr-2 h-4 w-4" /> Neue Kampagne
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kontakte</TableHead>
              <TableHead>Versand</TableHead>
              <TableHead>Zuletzt geaendert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  Noch keine Kampagnen. Leg gleich deine erste an.
                </TableCell>
              </TableRow>
            )}
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/app/campaigns/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </TableCell>
                <TableCell>{c._count.campaignContacts}</TableCell>
                <TableCell className="text-sm">{c.sendMode}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelative(c.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
