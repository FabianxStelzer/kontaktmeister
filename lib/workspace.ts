import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { WorkspaceRole } from "@prisma/client";

const WORKSPACE_COOKIE = "km_workspace";

export type WorkspaceContext = {
  userId: string;
  userEmail: string;
  userName: string | null;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
};

/**
 * Liefert den aktuellen Auth + Workspace-Kontext.
 * Leitet nach /login um, wenn nicht angemeldet, und nach /onboarding,
 * wenn noch kein Workspace existiert.
 */
export async function requireWorkspace(): Promise<WorkspaceContext> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const selected =
    memberships.find((m) => m.workspaceId === selectedId) ?? memberships[0];

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name ?? null,
    workspaceId: selected.workspaceId,
    workspaceName: selected.workspace.name,
    workspaceSlug: selected.workspace.slug,
    role: selected.role,
  };
}

export async function listMyWorkspaces(userId: string) {
  return prisma.workspaceMembership.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function setActiveWorkspace(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function requireRole(ctx: WorkspaceContext, roles: WorkspaceRole[]) {
  if (!roles.includes(ctx.role)) {
    throw new Error("Keine Berechtigung fuer diese Aktion");
  }
}

export const ACTIVE_WORKSPACE_COOKIE = WORKSPACE_COOKIE;
