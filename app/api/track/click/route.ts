import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/tracking";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ccId = url.searchParams.get("cc");
  const type = url.searchParams.get("type") ?? "link";
  const target = url.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Nur erlaubte Schemata, verhindert Open Redirects auf javascript:
  let dest: URL;
  try {
    dest = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(dest.protocol)) {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  if (ccId) {
    const cc = await prisma.campaignContact.findUnique({ where: { id: ccId } });
    if (cc) {
      const eventType = type === "cta" ? "CTA_CLICK" : "LINK_CLICK";
      await trackEvent(cc.id, eventType, req, { url: dest.toString() });
    }
  }

  return NextResponse.redirect(dest.toString(), 302);
}
