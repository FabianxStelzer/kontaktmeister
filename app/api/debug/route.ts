import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });

  const env = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    APP_URL: process.env.APP_URL,
    PUBLIC_URL: process.env.PUBLIC_URL,
    HAS_AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    HAS_ENCRYPTION_KEY: Boolean(process.env.ENCRYPTION_KEY),
  };

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    requestUrl: req.url,
    path: url.pathname,
    headers,
    env,
  });
}
