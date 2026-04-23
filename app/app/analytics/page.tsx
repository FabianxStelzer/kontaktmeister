import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const ctx = await requireWorkspace();
  const [sent, opens, pageViews, linkClicks, ctaClicks] = await Promise.all([
    prisma.campaignContact.count({
      where: { campaign: { workspaceId: ctx.workspaceId }, sendStatus: "SENT" },
    }),
    prisma.trackingEvent.count({
      where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } }, type: "EMAIL_OPEN" },
    }),
    prisma.trackingEvent.count({
      where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } }, type: "PAGE_VIEW" },
    }),
    prisma.trackingEvent.count({
      where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } }, type: "LINK_CLICK" },
    }),
    prisma.trackingEvent.count({
      where: { campaignContact: { campaign: { workspaceId: ctx.workspaceId } }, type: "CTA_CLICK" },
    }),
  ]);

  const openRate = sent ? Math.round((opens / sent) * 100) : 0;
  const ctr = opens ? Math.round((linkClicks / opens) * 100) : 0;
  const ctaRate = pageViews ? Math.round((ctaClicks / pageViews) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Email Opens" value={opens} />
        <Metric label="Page Views" value={pageViews} />
        <Metric label="Link Clicks" value={linkClicks} />
        <Metric label="CTA Clicks" value={ctaClicks} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Open Rate" value={`${openRate}%`} />
        <Metric label="CTR (Open→Click)" value={`${ctr}%`} />
        <Metric label="CTA Rate (View→CTA)" value={`${ctaRate}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-bold">{value}</CardContent>
    </Card>
  );
}
