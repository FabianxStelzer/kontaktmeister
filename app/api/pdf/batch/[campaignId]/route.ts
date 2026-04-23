import { NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import { prisma } from "@/lib/db";
import { renderLetterPdf } from "@/lib/pdf-letter";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await ctx.params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      workspace: true,
      campaignContacts: {
        include: { contact: { include: { company: true } } },
      },
    },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pass = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(pass);

  const publicUrl = process.env.PUBLIC_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  (async () => {
    for (const cc of campaign.campaignContacts) {
      const landingUrl = `${publicUrl}/p/${cc.slug}?utm_source=pdf-qr`;
      const pdfBuf = await renderLetterPdf({
        recipientName: `${cc.contact.firstName} ${cc.contact.lastName}`,
        companyName: cc.contact.company?.name ?? null,
        text: cc.landingpageText,
        workspaceName: campaign.workspace.name,
        landingUrl,
        ctaLabel: campaign.ctaLabel,
      });
      const filename = `${cc.contact.lastName}-${cc.contact.firstName}.pdf`
        .replace(/\s+/g, "-")
        .toLowerCase();
      archive.append(pdfBuf, { name: filename });
    }
    await archive.finalize();
  })().catch((err) => pass.destroy(err));

  return new NextResponse(pass as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=\"${campaign.name.replace(/\s+/g, "-").toLowerCase()}-pdfs.zip\"`,
      "Cache-Control": "no-store",
    },
  });
}
