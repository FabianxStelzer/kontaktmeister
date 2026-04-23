import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { WorkspaceRole } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  companyName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "workspace";
  let suffix = 0;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
  return slug;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, companyName, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "E-Mail ist bereits registriert." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = await uniqueSlug(companyName);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        emailVerified: new Date(),
      },
    });
    const workspace = await tx.workspace.create({
      data: { name: companyName, slug },
    });
    await tx.workspaceMembership.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: WorkspaceRole.OWNER,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
