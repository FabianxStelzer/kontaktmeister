import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApiKeysForm } from "./api-keys-form";
import { SmtpForm } from "./smtp-form";
import { TeamSection } from "./team-section";

export const metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const ctx = await requireWorkspace();

  const [ws, apiKeys, memberships] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: ctx.workspaceId } }),
    prisma.apiKey.findMany({ where: { workspaceId: ctx.workspaceId } }),
    prisma.workspaceMembership.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">Workspace {ctx.workspaceName}</p>
      </div>

      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys">API-Keys</TabsTrigger>
          <TabsTrigger value="smtp">E-Mail (SMTP)</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>HeyGen API-Key</CardTitle>
              <CardDescription>
                Dein workspace-eigener HeyGen-Key wird AES-256 verschluesselt gespeichert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeysForm
                hasHeygenKey={apiKeys.some((k) => k.service === "HEYGEN")}
                heygenLabel={apiKeys.find((k) => k.service === "HEYGEN")?.label ?? null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP-Konfiguration</CardTitle>
              <CardDescription>
                Standardmaessig nutzt Kontaktmeister das in ENV gesetzte Strato-SMTP. Optional kannst
                du hier eigene SMTP-Zugangsdaten hinterlegen (Passwort wird verschluesselt).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SmtpForm
                defaults={{
                  smtpHost: ws?.smtpHost ?? "",
                  smtpPort: ws?.smtpPort ?? 465,
                  smtpSecure: ws?.smtpSecure ?? true,
                  smtpUser: ws?.smtpUser ?? "",
                  hasPassword: Boolean(ws?.smtpPassEnc),
                  smtpFromName: ws?.smtpFromName ?? "",
                  smtpFromEmail: ws?.smtpFromEmail ?? "",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>
                Mitglieder dieses Workspaces. Admins und Owner koennen Mitglieder einladen und verwalten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamSection
                canManage={ctx.role === "OWNER" || ctx.role === "ADMIN"}
                currentRole={ctx.role}
                memberships={memberships.map((m) => ({
                  id: m.id,
                  role: m.role,
                  email: m.user.email,
                  name: m.user.name ?? "-",
                  createdAt: m.createdAt.toISOString(),
                  self: m.userId === ctx.userId,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
