"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorkspace, requireRole } from "@/lib/workspace";
import { setApiKey, deleteApiKey } from "@/lib/api-keys";
import { encrypt } from "@/lib/encryption";
import { sendTestMail } from "@/lib/mail";
import { WorkspaceRole } from "@prisma/client";

const heygenSchema = z.object({
  key: z.string().min(10),
  label: z.string().optional(),
});

export async function saveHeygenKey(formData: FormData) {
  const ctx = await requireWorkspace();
  requireRole(ctx, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);
  const parsed = heygenSchema.safeParse({
    key: formData.get("key"),
    label: formData.get("label") ?? undefined,
  });
  if (!parsed.success) throw new Error("Ungueltige Eingabe");
  await setApiKey(ctx.workspaceId, "HEYGEN", parsed.data.key, parsed.data.label);
  revalidatePath("/app/settings");
}

export async function removeHeygenKey() {
  const ctx = await requireWorkspace();
  requireRole(ctx, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);
  await deleteApiKey(ctx.workspaceId, "HEYGEN");
  revalidatePath("/app/settings");
}

const smtpSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().optional(),
  smtpSecure: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFromName: z.string().optional(),
  smtpFromEmail: z.string().email().optional().or(z.literal("").transform(() => undefined)),
});

export async function saveSmtp(formData: FormData) {
  const ctx = await requireWorkspace();
  requireRole(ctx, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

  const raw = Object.fromEntries(formData.entries());
  const parsed = smtpSchema.parse(raw);

  const update: Record<string, unknown> = {
    smtpHost: parsed.smtpHost || null,
    smtpPort: parsed.smtpPort || null,
    smtpSecure: parsed.smtpSecure ?? null,
    smtpUser: parsed.smtpUser || null,
    smtpFromName: parsed.smtpFromName || null,
    smtpFromEmail: parsed.smtpFromEmail || null,
  };
  if (parsed.smtpPass) {
    update.smtpPassEnc = encrypt(parsed.smtpPass);
  }

  await prisma.workspace.update({ where: { id: ctx.workspaceId }, data: update });
  revalidatePath("/app/settings");
}

export async function testSmtp(formData: FormData) {
  const ctx = await requireWorkspace();
  requireRole(ctx, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);
  const to = String(formData.get("to") ?? ctx.userEmail);
  const { getWorkspaceSmtp } = await import("@/lib/mail");
  const cfg = await getWorkspaceSmtp(ctx.workspaceId);
  await sendTestMail(cfg, to);
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export async function inviteMember(formData: FormData) {
  const ctx = await requireWorkspace();
  requireRole(ctx, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);
  const parsed = inviteSchema.parse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (parsed.role === "OWNER" && ctx.role !== WorkspaceRole.OWNER) {
    throw new Error("Nur Owner kann weitere Owner vergeben.");
  }
  const email = parsed.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Benutzer mit dieser E-Mail existiert nicht.");

  await prisma.workspaceMembership.upsert({
    where: { workspaceId_userId: { workspaceId: ctx.workspaceId, userId: user.id } },
    create: { workspaceId: ctx.workspaceId, userId: user.id, role: parsed.role },
    update: { role: parsed.role },
  });

  revalidatePath("/app/settings");
}

export async function removeMember(membershipId: string) {
  const ctx = await requireWorkspace();
  requireRole(ctx, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);
  const membership = await prisma.workspaceMembership.findFirst({
    where: { id: membershipId, workspaceId: ctx.workspaceId },
  });
  if (!membership) return;
  if (membership.userId === ctx.userId) throw new Error("Du kannst dich nicht selbst entfernen.");
  await prisma.workspaceMembership.delete({ where: { id: membership.id } });
  revalidatePath("/app/settings");
}
