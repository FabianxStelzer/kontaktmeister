import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/tracking";

const GIF_1PX = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  if (token) {
    const cc = await prisma.campaignContact.findFirst({
      where: { OR: [{ id: token }, { unsubscribeToken: token }] },
      select: { id: true },
    });
    if (cc) {
      await trackEvent(cc.id, "EMAIL_OPEN", req);
    }
  }

  return new NextResponse(new Uint8Array(GIF_1PX), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(GIF_1PX.length),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
