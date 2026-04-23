import { notFound } from "next/navigation";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignActions } from "./campaign-actions";
import { Download, ExternalLink, FileText } from "lucide-react";
import type { CampaignStatus, VideoStatus, SendStatus, EventType } from "@prisma/client";

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

const VIDEO_LABEL: Record<VideoStatus, string> = {
  PENDING: "Wartend",
  QUEUED: "In Queue",
  PROCESSING: "Rendert...",
  READY: "Fertig",
  FAILED: "Fehler",
  SKIPPED: "Uebersprungen",
};
const SEND_LABEL: Record<SendStatus, string> = {
  PENDING: "Wartend",
  QUEUED: "In Queue",
  SENT: "Versendet",
  FAILED: "Fehler",
  BOUNCED: "Bounce",
  SKIPPED_OPTOUT: "Opt-Out",
};

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireWorkspace();

  const campaign = await prisma.campaign.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: {
      campaignContacts: {
        include: {
          contact: { include: { company: true } },
          trackingEvents: { select: { type: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!campaign) notFound();

  const total = campaign.campaignContacts.length;
  const videoReady = campaign.campaignContacts.filter((c) => c.videoStatus === "READY").length;
  const mailsSent = campaign.campaignContacts.filter((c) => c.sendStatus === "SENT").length;

  const countEvent = (t: EventType) =>
    campaign.campaignContacts.reduce(
      (acc, c) => acc + c.trackingEvents.filter((e) => e.type === t).length,
      0,
    );

  const opens = countEvent("EMAIL_OPEN");
  const pageViews = countEvent("PAGE_VIEW");
  const ctaClicks = countEvent("CTA_CLICK");

  const publicUrl = process.env.PUBLIC_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant={STATUS_VARIANT[campaign.status]}>{STATUS_LABEL[campaign.status]}</Badge>
          </div>
          {campaign.description && (
            <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>
          )}
        </div>
        <CampaignActions campaignId={campaign.id} status={campaign.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Kontakte" value={total} />
        <Stat label="Videos fertig" value={`${videoReady}/${total}`} />
        <Stat label="Mails versendet" value={`${mailsSent}/${total}`} />
        <Stat label="Opens" value={opens} />
        <Stat label="Page Views" value={pageViews} />
        <Stat label="CTA-Klicks" value={ctaClicks} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kontakte in dieser Kampagne</CardTitle>
          <CardDescription>Je Kontakt: Video-Status, Versand-Status, Landingpage-Link.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kontakt</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Versand</TableHead>
                <TableHead>Landingpage</TableHead>
                <TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.campaignContacts.map((cc) => (
                <TableRow key={cc.id}>
                  <TableCell>
                    <div className="font-medium">
                      {cc.contact.firstName} {cc.contact.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{cc.contact.email ?? "-"}</div>
                  </TableCell>
                  <TableCell className="text-sm">{cc.contact.company?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        cc.videoStatus === "READY"
                          ? "success"
                          : cc.videoStatus === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {VIDEO_LABEL[cc.videoStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        cc.sendStatus === "SENT"
                          ? "success"
                          : cc.sendStatus === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {SEND_LABEL[cc.sendStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`${publicUrl}/p/${cc.slug}`} target="_blank">
                        <ExternalLink className="mr-1 h-3 w-3" /> Oeffnen
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/api/pdf/${cc.id}`} target="_blank" rel="noreferrer">
                        <FileText className="mr-1 h-3 w-3" /> PDF
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-semibold">Video-Script</div>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
              {campaign.scriptTemplate}
            </pre>
          </div>
          <div>
            <div className="text-sm font-semibold">E-Mail-Betreff</div>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
              {campaign.emailSubjectTpl}
            </pre>
          </div>
          <div>
            <div className="text-sm font-semibold">E-Mail-Body</div>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
              {campaign.emailBodyTpl}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <a href={`/api/pdf/batch/${campaign.id}`}>
            <Download className="mr-2 h-4 w-4" /> Alle PDFs als ZIP
          </a>
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
