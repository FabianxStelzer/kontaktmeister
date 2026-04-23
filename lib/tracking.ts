import { prisma } from "@/lib/db";
import type { EventType } from "@prisma/client";
import type { NextRequest } from "next/server";

export function anonymizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // IPv4: letztes Oktett auf 0; IPv6: letzten 64 Bit auf 0
  if (ip.includes(".")) {
    return ip.replace(/\.\d+$/, ".0");
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 4).concat(["0", "0", "0", "0"]).join(":");
  }
  return null;
}

export function extractClientContext(req: Request | NextRequest) {
  const headers = req.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    null;
  const userAgent = headers.get("user-agent") ?? null;
  const referer = headers.get("referer") ?? null;
  return {
    ip: anonymizeIp(ip),
    userAgent,
    referer,
  };
}

export async function trackEvent(
  campaignContactId: string,
  type: EventType,
  req: Request | NextRequest,
  meta?: Record<string, unknown>,
) {
  const ctx = extractClientContext(req);
  try {
    await prisma.trackingEvent.create({
      data: {
        campaignContactId,
        type,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        referer: ctx.referer,
        meta: meta as object | undefined,
      },
    });
  } catch (err) {
    console.error("trackEvent failed", err);
  }
}
