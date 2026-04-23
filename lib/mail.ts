import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { renderCampaignEmail } from "@/emails/campaign-email";
import { SendStatus } from "@prisma/client";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
};

function envConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  if (!host || !user || !pass || !fromEmail) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? "true") !== "false",
    user,
    pass,
    fromName: process.env.SMTP_FROM_NAME ?? "Kontaktmeister",
    fromEmail,
  };
}

export async function getWorkspaceSmtp(workspaceId: string): Promise<SmtpConfig> {
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  const envCfg = envConfig();

  if (
    ws?.smtpHost &&
    ws.smtpUser &&
    ws.smtpPassEnc &&
    ws.smtpFromEmail
  ) {
    let pass = "";
    try {
      pass = decrypt(ws.smtpPassEnc);
    } catch {
      pass = "";
    }
    return {
      host: ws.smtpHost,
      port: ws.smtpPort ?? 465,
      secure: ws.smtpSecure ?? true,
      user: ws.smtpUser,
      pass,
      fromName: ws.smtpFromName ?? ws.name,
      fromEmail: ws.smtpFromEmail,
    };
  }

  if (!envCfg) {
    throw new Error(
      "Kein SMTP konfiguriert - weder im Workspace noch in ENV (SMTP_HOST, SMTP_USER, ...)",
    );
  }
  return envCfg;
}

function buildTransport(cfg: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendTestMail(
  cfg: SmtpConfig,
  to: string,
  subject = "Kontaktmeister Test",
  body = "Dies ist eine SMTP-Test-Mail von Kontaktmeister.",
) {
  const transport = buildTransport(cfg);
  await transport.sendMail({
    from: { name: cfg.fromName, address: cfg.fromEmail },
    to,
    subject,
    text: body,
    html: `<p>${body}</p>`,
  });
}

/**
 * Versendet die Mail fuer einen CampaignContact.
 * Track-Pixel, Click-Tracking, Unsubscribe-Footer werden automatisch eingebaut.
 */
export async function sendCampaignMail(campaignContactId: string): Promise<void> {
  const cc = await prisma.campaignContact.findUnique({
    where: { id: campaignContactId },
    include: {
      contact: { include: { company: true } },
      campaign: { include: { workspace: true } },
    },
  });
  if (!cc) throw new Error("CampaignContact nicht gefunden");
  if (!cc.contact.email) throw new Error("Kontakt hat keine E-Mail");

  const cfg = await getWorkspaceSmtp(cc.campaign.workspaceId);
  const transport = buildTransport(cfg);

  const publicUrl = process.env.PUBLIC_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const appUrl = process.env.APP_URL ?? publicUrl;

  const landingUrl = `${publicUrl}/p/${cc.slug}`;
  const unsubscribeUrl = `${appUrl}/api/unsubscribe/${cc.unsubscribeToken}`;
  const openPixelUrl = `${appUrl}/api/track/open.gif?t=${cc.id}`;

  const { html, text } = renderCampaignEmail({
    subject: cc.emailSubject,
    body: cc.emailBody,
    recipientName: `${cc.contact.firstName} ${cc.contact.lastName}`,
    workspaceName: cc.campaign.workspace.name,
    landingUrl,
    unsubscribeUrl,
    openPixelUrl,
    appUrl,
    campaignContactId: cc.id,
  });

  const info = await transport.sendMail({
    from: { name: cfg.fromName, address: cfg.fromEmail },
    to: cc.contact.email,
    subject: cc.emailSubject,
    text,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:${cfg.fromEmail}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-KM-Campaign": cc.campaignId,
      "X-KM-CC": cc.id,
    },
  });

  await prisma.emailSend.create({
    data: {
      campaignContactId: cc.id,
      messageId: info.messageId,
      subject: cc.emailSubject,
      fromEmail: cfg.fromEmail,
      toEmail: cc.contact.email,
      status: SendStatus.SENT,
      sentAt: new Date(),
    },
  });
}
