import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import { WorkspaceRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

async function createWorkspaceAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  let slug = slugify(name) || "workspace";
  let i = 0;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${slugify(name)}-${i}`;
  }

  await prisma.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: session.user.id, role: WorkspaceRole.OWNER },
      },
    },
  });
  redirect("/app/dashboard");
}

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const existing = await prisma.workspaceMembership.findFirst({
    where: { userId: session.user.id },
  });
  if (existing) redirect("/app/dashboard");

  return (
    <div className="container flex min-h-screen items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workspace anlegen</CardTitle>
          <CardDescription>
            Lege einen Workspace fuer dein Team oder deine Firma an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createWorkspaceAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace-Name</Label>
              <Input id="name" name="name" required placeholder="z.B. Agentur Mueller" />
            </div>
            <Button type="submit" className="w-full">Anlegen</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
