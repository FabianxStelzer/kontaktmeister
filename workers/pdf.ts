import { prisma } from "../lib/db";

// Platzhalter - PDF-Generierung on-demand ueber HTTP-Endpunkt,
// dieser Worker koennte asynchrone Batch-Erzeugung machen.
export async function processPdfJob(data: { campaignContactId: string }) {
  const cc = await prisma.campaignContact.findUnique({ where: { id: data.campaignContactId } });
  if (!cc) return;
  // TODO: falls gewuenscht, PDF auf Disk/S3 persistieren
}
