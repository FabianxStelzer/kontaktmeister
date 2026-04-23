import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import type { ApiService } from "@prisma/client";

export async function getApiKey(workspaceId: string, service: ApiService): Promise<string | null> {
  const entry = await prisma.apiKey.findUnique({
    where: { workspaceId_service: { workspaceId, service } },
  });
  if (!entry) return null;
  try {
    return decrypt(entry.encryptedKey);
  } catch (err) {
    console.error("Entschluesselung des API-Keys fehlgeschlagen", err);
    return null;
  }
}

export async function setApiKey(workspaceId: string, service: ApiService, plain: string, label?: string) {
  const encryptedKey = encrypt(plain);
  await prisma.apiKey.upsert({
    where: { workspaceId_service: { workspaceId, service } },
    create: { workspaceId, service, encryptedKey, label },
    update: { encryptedKey, label },
  });
}

export async function deleteApiKey(workspaceId: string, service: ApiService) {
  await prisma.apiKey.deleteMany({ where: { workspaceId, service } });
}

export function heygenKeyFor(workspaceKey: string | null): string {
  return workspaceKey || process.env.HEYGEN_API_KEY || "";
}
