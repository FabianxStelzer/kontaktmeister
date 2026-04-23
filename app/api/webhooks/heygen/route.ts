import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { getQueues } from "@/lib/queue";
import { VideoStatus, SendMode, CampaignStatus } from "@prisma/client";

// HeyGen-Webhook-Handler (Alternative zum Polling).
// Zur Aktivierung in HeyGen-Dashboard: POST an /api/webhooks/heygen
// Signature-Check via HEYGEN_WEBHOOK_SECRET.

function verify(body: string, signature: string | null): boolean {
  const secret = process.env.HEYGEN_WEBHOOK_SECRET;
  if (!secret) return true; // wenn nicht gesetzt, Signatur-Check ueberspringen
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-heygen-signature") ?? req.headers.get("signature");
  if (!verify(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { event_type?: string; event_data?: { video_id?: string; url?: string; thumbnail_url?: string; callback_id?: string; msg?: string } };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoId = body.event_data?.video_id;
  if (!videoId) return NextResponse.json({ ok: true });

  const cc = await prisma.campaignContact.findFirst({
    where: { heygenVideoId: videoId },
    include: { campaign: true },
  });
  if (!cc) return NextResponse.json({ ok: true });

  if (body.event_type === "avatar_video.success" || body.event_type === "video.completed") {
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: {
        videoStatus: VideoStatus.READY,
        videoUrl: body.event_data?.url,
        videoThumbnail: body.event_data?.thumbnail_url,
      },
    });

    if (
      (cc.campaign.status === CampaignStatus.RUNNING ||
        cc.campaign.status === CampaignStatus.SCHEDULED) &&
      (cc.campaign.sendMode === SendMode.EMAIL || cc.campaign.sendMode === SendMode.BOTH)
    ) {
      const queues = getQueues();
      await queues.mail.add("send", { campaignContactId: cc.id });
    }
  } else if (body.event_type === "avatar_video.fail" || body.event_type === "video.failed") {
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: {
        videoStatus: VideoStatus.FAILED,
        videoError: body.event_data?.msg ?? "HeyGen meldet Fehler",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
