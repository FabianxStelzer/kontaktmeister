import { requireSuperadmin, clearSuperadminCookie } from "@/lib/superadmin";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  await clearSuperadminCookie();
  redirect("/admin/login");
}

export default async function SuperadminDashboard() {
  const admin = await requireSuperadmin();

  const [workspaceCount, userCount, campaignCount, running] = await Promise.all([
    prisma.workspace.count(),
    prisma.user.count(),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "RUNNING" } }),
  ]);

  const recent = await prisma.workspace.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { _count: { select: { members: true, contacts: true, campaigns: true } } },
  });

  return (
    <main className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Superadmin</h1>
          <p className="text-sm text-muted-foreground">Angemeldet als {admin.email}</p>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">Logout</Button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Workspaces" value={workspaceCount} />
        <Stat label="Nutzer" value={userCount} />
        <Stat label="Kampagnen" value={campaignCount} />
        <Stat label="Aktive Kampagnen" value={running} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{w.name}</div>
                <div className="text-xs text-muted-foreground">/{w.slug} · {w.plan}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{w._count.members} Mitglieder</div>
                <div>{w._count.contacts} Kontakte · {w._count.campaigns} Kampagnen</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
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
