import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "km_super";

function secret() {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

function sign(value: string) {
  const mac = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${mac}`;
}

function verify(token: string): string | null {
  const [value, mac] = token.split(".");
  if (!value || !mac) return null;
  const expected = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return value;
}

export async function setSuperadminCookie(id: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSuperadminCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function requireSuperadmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) redirect("/admin/login");
  const id = verify(token);
  if (!id) redirect("/admin/login");
  const admin = await prisma.superAdmin.findUnique({ where: { id } });
  if (!admin) redirect("/admin/login");
  return admin;
}
