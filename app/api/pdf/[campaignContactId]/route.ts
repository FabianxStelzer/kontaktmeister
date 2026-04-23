import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderLetterPdf } from "@/lib/pdf-letter";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ campaignContactId: string }> },
) {
  const { campaignContactId } = await ctx.params;
  const cc = await prisma.campaignContact.findUnique({
    where: { id: campaignContactId },
    include: {
      contact: { include: { company: true } },
      campaign: { include: { workspace: true } },
    },
  });
  if (!cc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const publicUrl = process.env.PUBLIC_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const landingUrl = `${publicUrl}/p/${cc.slug}?utm_source=pdf-qr`;

  const pdf = await renderLetterPdf({
    recipientName: `${cc.contact.firstName} ${cc.contact.lastName}`,
    companyName: cc.contact.company?.name ?? null,
    text: cc.landingpageText,
    workspaceName: cc.campaign.workspace.name,
    landingUrl,
    ctaLabel: cc.campaign.ctaLabel,
  });

  const filename = `kontaktmeister-${cc.contact.lastName}-${cc.contact.firstName}.pdf`
    .replace(/\s+/g, "-")
    .toLowerCase();

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    },
  });
}
