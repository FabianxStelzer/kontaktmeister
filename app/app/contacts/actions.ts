"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Gender } from "@prisma/client";

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  position: z.string().optional(),
  salutation: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  companyId: z.string().optional().or(z.literal("").transform(() => undefined)),
  companyName: z.string().optional(),
});

export async function createContact(formData: FormData) {
  const ctx = await requireWorkspace();
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Validierungsfehler: " + JSON.stringify(parsed.error.flatten()));
  }
  const data = parsed.data;

  let companyId = data.companyId || undefined;
  if (!companyId && data.companyName) {
    const existing = await prisma.company.findFirst({
      where: { workspaceId: ctx.workspaceId, name: data.companyName },
    });
    companyId = existing
      ? existing.id
      : (
          await prisma.company.create({
            data: { workspaceId: ctx.workspaceId, name: data.companyName },
          })
        ).id;
  }

  if (data.email) {
    const dup = await prisma.contact.findFirst({
      where: { workspaceId: ctx.workspaceId, email: data.email },
    });
    if (dup) throw new Error("Ein Kontakt mit dieser E-Mail existiert bereits.");
  }

  await prisma.contact.create({
    data: {
      workspaceId: ctx.workspaceId,
      companyId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      position: data.position || undefined,
      salutation: data.salutation || undefined,
      gender: data.gender,
      linkedinUrl: data.linkedinUrl,
    },
  });

  revalidatePath("/app/contacts");
  redirect("/app/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  const ctx = await requireWorkspace();
  const existing = await prisma.contact.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) throw new Error("Kontakt nicht gefunden");

  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Validierungsfehler");
  const data = parsed.data;

  let companyId = data.companyId || undefined;
  if (!companyId && data.companyName) {
    const existingCompany = await prisma.company.findFirst({
      where: { workspaceId: ctx.workspaceId, name: data.companyName },
    });
    companyId = existingCompany
      ? existingCompany.id
      : (
          await prisma.company.create({
            data: { workspaceId: ctx.workspaceId, name: data.companyName },
          })
        ).id;
  }

  await prisma.contact.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      position: data.position || null,
      salutation: data.salutation || null,
      gender: data.gender ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      companyId: companyId ?? null,
    },
  });

  revalidatePath("/app/contacts");
  revalidatePath(`/app/contacts/${id}`);
  redirect("/app/contacts");
}

export async function deleteContact(id: string) {
  const ctx = await requireWorkspace();
  await prisma.contact.deleteMany({ where: { id, workspaceId: ctx.workspaceId } });
  revalidatePath("/app/contacts");
}

// Importiert eine Liste von Kontakten aus einem CSV-Mapping.
const importRowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  salutation: z.string().optional(),
  companyName: z.string().optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export async function importContacts(rows: ImportRow[]) {
  const ctx = await requireWorkspace();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  const companyCache = new Map<string, string>();

  for (const [idx, row] of rows.entries()) {
    const parsed = importRowSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(`Zeile ${idx + 2}: Validierungsfehler`);
      continue;
    }
    const { firstName, lastName, email, phone, position, salutation, companyName } = parsed.data;

    if (email) {
      const exists = await prisma.contact.findFirst({
        where: { workspaceId: ctx.workspaceId, email },
      });
      if (exists) {
        skipped += 1;
        continue;
      }
    }

    let companyId: string | undefined;
    if (companyName) {
      companyId = companyCache.get(companyName);
      if (!companyId) {
        const existing = await prisma.company.findFirst({
          where: { workspaceId: ctx.workspaceId, name: companyName },
        });
        if (existing) {
          companyId = existing.id;
        } else {
          const newCompany = await prisma.company.create({
            data: { workspaceId: ctx.workspaceId, name: companyName },
          });
          companyId = newCompany.id;
        }
        companyCache.set(companyName, companyId);
      }
    }

    await prisma.contact.create({
      data: {
        workspaceId: ctx.workspaceId,
        firstName,
        lastName,
        email,
        phone,
        position,
        salutation,
        companyId,
      },
    });
    created += 1;
  }

  revalidatePath("/app/contacts");
  return { created, skipped, errors };
}
