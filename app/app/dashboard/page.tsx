import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPlaceholder() {
  const ctx = await requireWorkspace();
  const [campaigns, contacts, events] = await Promise.all([
    prisma.campaign.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { _count: { select: { campaignContacts: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.contact.count({ where: { workspaceId: ctx.workspaceId } }),
    prisma.trackingEvent.findMany({
      where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } } },
      include: { campaignContact: { include: { contact: true, campaign: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const sent = await prisma.campaignContact.count({
    where: { campaign: { workspaceId: ctx.workspaceId }, sendStatus: "SENT" },
  });
  const opened = await prisma.trackingEvent.count({
    where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } }, type: "EMAIL_OPEN" },
  });
  const clicked = await prisma.trackingEvent.count({
    where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } }, type: "LINK_CLICK" },
  });
  const booked = await prisma.trackingEvent.count({
    where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } }, type: "CTA_CLICK" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Willkommen im Workspace {ctx.workspaceName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Uebersicht ueber Kampagnen und Aktivitaeten.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Kontakte" value={contacts} />
        <Stat label="Mails gesendet" value={sent} />
        <Stat label="Opens" value={opened} />
        <Stat label="Klicks" value={clicked} />
        <Stat label="CTA-Klicks" value={booked} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Letzte Kampagnen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaigns.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Kampagnen.</p>}
            {campaigns.map((c) => (
              <a key={c.id} href={`/app/campaigns/${c.id}`} className="block rounded-md border p-3 hover:bg-accent">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.name}</div>
                  <Badge variant={c.status === "RUNNING" ? "default" : c.status === "DONE" ? "success" : "secondary"}>
                    {c.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{c._count.campaignContacts} Kontakte</div>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitaetsfeed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Aktivitaet.</p>}
            {events.map((e) => (
              <div key={e.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">
                  {e.campaignContact.contact.firstName} {e.campaignContact.contact.lastName} · {e.type}
                </div>
                <div className="text-xs text-muted-foreground">
                  {e.campaignContact.campaign.name} · {formatRelative(e.createdAt)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
