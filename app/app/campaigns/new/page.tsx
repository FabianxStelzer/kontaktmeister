import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { CampaignWizard } from "./campaign-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Neue Kampagne" };

export default async function NewCampaignPage() {
  const ctx = await requireWorkspace();
  const contacts = await prisma.contact.findMany({
    where: { workspaceId: ctx.workspaceId, optedOut: false },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neue Kampagne anlegen</CardTitle>
          <CardDescription>
            Schritt-fuer-Schritt: Kontakte waehlen, Video-Template konfigurieren, Texte verfassen.
            Platzhalter: &#123;&#123;firstName&#125;&#125;, &#123;&#123;lastName&#125;&#125;,
            &#123;&#123;company&#125;&#125;, &#123;&#123;position&#125;&#125;,
            &#123;&#123;landingpageUrl&#125;&#125;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignWizard
            contacts={contacts.map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              email: c.email,
              companyName: c.company?.name ?? null,
              position: c.position,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
