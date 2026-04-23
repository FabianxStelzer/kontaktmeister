import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Upload, Search } from "lucide-react";
import { ContactRowActions } from "./row-actions";

export const metadata = { title: "Kontakte" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireWorkspace();
  const { q } = await searchParams;

  const contacts = await prisma.contact.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { position: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { company: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const total = await prisma.contact.count({ where: { workspaceId: ctx.workspaceId } });
  const optedOut = await prisma.contact.count({
    where: { workspaceId: ctx.workspaceId, optedOut: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kontakte</h1>
          <p className="text-sm text-muted-foreground">
            {total} Kontakte gesamt {optedOut > 0 && `(${optedOut} Opt-Out)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/app/contacts/import">
              <Upload className="mr-2 h-4 w-4" /> CSV-Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/app/contacts/new">
              <Plus className="mr-2 h-4 w-4" /> Neuer Kontakt
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Suche nach Name, Mail, Firma..." className="pl-8" />
        </div>
        <Button type="submit" variant="secondary">Suchen</Button>
      </form>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  Noch keine Kontakte. Lege einen neuen an oder importiere eine CSV-Datei.
                </TableCell>
              </TableRow>
            )}
            {contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/app/contacts/${c.id}`} className="hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                </TableCell>
                <TableCell>{c.email ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.position ?? "-"}</TableCell>
                <TableCell className="text-sm">{c.company?.name ?? "-"}</TableCell>
                <TableCell>
                  {c.optedOut ? (
                    <Badge variant="destructive">Opt-Out</Badge>
                  ) : (
                    <Badge variant="secondary">Aktiv</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <ContactRowActions contactId={c.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
