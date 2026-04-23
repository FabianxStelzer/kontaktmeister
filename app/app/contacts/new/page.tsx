import { ContactForm } from "../contact-form";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { createContact } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Neuer Kontakt" };

export default async function NewContactPage() {
  const ctx = await requireWorkspace();
  const companies = await prisma.company.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Neuer Kontakt</CardTitle>
          <CardDescription>
            Lege einen neuen Kontakt an - optional direkt mit einer Firma verknuepft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm companies={companies} action={createContact} submitLabel="Kontakt anlegen" />
        </CardContent>
      </Card>
    </div>
  );
}
