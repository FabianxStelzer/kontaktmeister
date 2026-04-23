import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { listMyWorkspaces, ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspace";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  console.log("[APP_LAYOUT_CALLED] @", new Date().toISOString());

  // WICHTIG: kein redirect() hier - das wuerde fuer ALLE routes triggern,
  // wenn Next.js das Layout globaler als erwartet anwendet.
  // Stattdessen: wenn keine session, einfach Kinder durchreichen;
  // die einzelnen /app/*/page.tsx rufen requireWorkspace() selbst auf.
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return <>{children}</>;
  }

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const selected =
    memberships.find((m) => m.workspaceId === selectedId) ?? memberships[0];

  const ctx = {
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name ?? null,
    workspaceId: selected.workspaceId,
    workspaceName: selected.workspace.name,
    workspaceSlug: selected.workspace.slug,
    role: selected.role,
  };

  const workspaces = await listMyWorkspaces(ctx.userId);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={ctx.role} />
      <div className="flex flex-1 flex-col">
        <Topbar
          ctx={ctx}
          workspaces={workspaces.map((m) => ({
            id: m.workspaceId,
            name: m.workspace.name,
            slug: m.workspace.slug,
            role: m.role,
          }))}
        />
        <main className="flex-1 bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
