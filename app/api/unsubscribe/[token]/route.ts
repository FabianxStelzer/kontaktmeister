import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/tracking";

async function unsubscribeByToken(token: string, req: Request) {
  const cc = await prisma.campaignContact.findUnique({
    where: { unsubscribeToken: token },
    include: { contact: true, campaign: true },
  });
  if (!cc || !cc.contact.email) return null;

  const email = cc.contact.email.toLowerCase();
  await prisma.$transaction([
    prisma.unsubscribe.upsert({
      where: { workspaceId_email: { workspaceId: cc.campaign.workspaceId, email } },
      create: {
        workspaceId: cc.campaign.workspaceId,
        email,
        source: "unsubscribe-link",
      },
      update: {},
    }),
    prisma.contact.update({
      where: { id: cc.contactId },
      data: { optedOut: true, optedOutAt: new Date() },
    }),
  ]);

  await trackEvent(cc.id, "UNSUBSCRIBE", req);
  return cc;
}

// List-Unsubscribe-Post (RFC 8058, One-Click)
export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  await unsubscribeByToken(token, req);
  return NextResponse.json({ ok: true });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const cc = await unsubscribeByToken(token, req);

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Abgemeldet</title><style>body{font-family:Arial,sans-serif;background:#f5f7fb;color:#1b2333;margin:0;padding:0;}main{max-width:520px;margin:80px auto;background:#fff;border:1px solid #e6e9ef;border-radius:12px;padding:32px;text-align:center;}h1{margin:0 0 8px 0;}p{color:#556}</style></head><body><main>
    ${cc
      ? `<h1>Du bist abgemeldet</h1><p>Dein Wunsch wurde gespeichert. Du erhaeltst ab jetzt keine weiteren Mails mehr von <strong>${cc.campaign.workspaceId}</strong> aus dieser Quelle.</p>`
      : `<h1>Abmeldung</h1><p>Der Link ist ungueltig oder bereits verarbeitet.</p>`}
    <p style="margin-top:16px;font-size:13px;color:#8a94a6">Bei Fragen antworte einfach auf die urspruengliche Mail.</p>
  </main></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
