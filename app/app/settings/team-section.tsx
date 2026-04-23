"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inviteMember, removeMember } from "./actions";

type Member = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  email: string;
  name: string;
  createdAt: string;
  self: boolean;
};

export function TeamSection({
  canManage,
  currentRole,
  memberships,
}: {
  canManage: boolean;
  currentRole: "OWNER" | "ADMIN" | "MEMBER";
  memberships: Member[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      {canManage && (
        <form
          action={(fd) =>
            start(async () => {
              await inviteMember(fd);
              router.refresh();
            })
          }
          className="grid grid-cols-1 gap-2 rounded-md border p-4 md:grid-cols-4"
        >
          <Input name="email" type="email" required placeholder="mitglied@firma.de" className="md:col-span-2" />
          <select
            name="role"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            defaultValue="MEMBER"
          >
            {currentRole === "OWNER" && <option value="OWNER">Owner</option>}
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </select>
          <Button type="submit" disabled={pending}>Hinzufuegen</Button>
        </form>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Seit</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>
                  <Badge variant={m.role === "OWNER" ? "default" : m.role === "ADMIN" ? "warning" : "secondary"}>
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(m.createdAt).toLocaleDateString("de-DE")}</TableCell>
                <TableCell className="text-right">
                  {canManage && !m.self && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        start(async () => {
                          if (!confirm("Mitglied entfernen?")) return;
                          await removeMember(m.id);
                          router.refresh();
                        })
                      }
                      disabled={pending}
                    >
                      Entfernen
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
