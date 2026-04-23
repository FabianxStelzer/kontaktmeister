"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { setActiveWorkspace } from "@/lib/workspace";
import { revalidatePath } from "next/cache";

export async function switchWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");
  const membership = await prisma.workspaceMembership.findFirst({
    where: { userId: session.user.id, workspaceId },
  });
  if (!membership) throw new Error("Kein Zugriff auf diesen Workspace");
  await setActiveWorkspace(workspaceId);
  revalidatePath("/app", "layout");
}
