import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { ContactForm } from "../contact-form";
import { updateContact } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Kontakt bearbeiten" };

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireWorkspace();

  const contact = await prisma.contact.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!contact) notFound();

  const companies = await prisma.company.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const action = updateContact.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {contact.firstName} {contact.lastName}
          </CardTitle>
          <CardDescription>Kontaktdaten bearbeiten</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm
            companies={companies}
            action={action}
            submitLabel="Speichern"
            defaults={{
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              position: contact.position,
              salutation: contact.salutation,
              gender: contact.gender ?? null,
              linkedinUrl: contact.linkedinUrl,
              companyId: contact.companyId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
