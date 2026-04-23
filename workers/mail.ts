import { prisma } from "../lib/db";
import { sendCampaignMail } from "../lib/mail";
import { SendStatus } from "@prisma/client";

export async function processMailJob(data: { campaignContactId: string }) {
  const cc = await prisma.campaignContact.findUnique({
    where: { id: data.campaignContactId },
    include: {
      contact: true,
      campaign: { include: { workspace: true } },
    },
  });
  if (!cc) throw new Error(`CampaignContact ${data.campaignContactId} nicht gefunden`);
  if (!cc.contact.email) {
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { sendStatus: SendStatus.SKIPPED_OPTOUT },
    });
    return;
  }

  // Opt-Out pruefen
  const optedOut = await prisma.unsubscribe.findFirst({
    where: { workspaceId: cc.campaign.workspaceId, email: cc.contact.email },
  });
  if (optedOut || cc.contact.optedOut) {
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { sendStatus: SendStatus.SKIPPED_OPTOUT },
    });
    return;
  }

  try {
    await sendCampaignMail(cc.id);
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { sendStatus: SendStatus.SENT, sentAt: new Date() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { sendStatus: SendStatus.FAILED },
    });
    await prisma.emailSend.create({
      data: {
        campaignContactId: cc.id,
        subject: cc.emailSubject,
        fromEmail: cc.campaign.workspace.smtpFromEmail ?? process.env.SMTP_FROM_EMAIL ?? "",
        toEmail: cc.contact.email,
        status: SendStatus.FAILED,
        error: msg,
      },
    });
    throw err;
  }
}
