import { requireWorkspace, listMyWorkspaces } from "@/lib/workspace";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireWorkspace();
  const workspaces = await listMyWorkspaces(ctx.userId);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={ctx.role} />
      <div className="flex flex-1 flex-col">
        <Topbar ctx={ctx} workspaces={workspaces.map((m) => ({
          id: m.workspaceId,
          name: m.workspace.name,
          slug: m.workspace.slug,
          role: m.role,
        }))} />
        <main className="flex-1 bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
