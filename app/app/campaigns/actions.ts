"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { buildContactVars, renderTemplate } from "@/lib/templates";
import { CampaignStatus, SendMode, VideoStatus } from "@prisma/client";
import { getQueues } from "@/lib/queue";

const campaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  heygenTemplateId: z.string().optional(),
  heygenAvatarId: z.string().optional(),
  heygenVoiceId: z.string().optional(),
  scriptTemplate: z.string().min(5),
  landingpageHeadline: z.string().optional(),
  landingpageTextTpl: z.string().min(1),
  emailSubjectTpl: z.string().min(1),
  emailBodyTpl: z.string().min(1),
  bookingUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  ctaLabel: z.string().optional(),
  sendMode: z.nativeEnum(SendMode).default(SendMode.EMAIL),
  contactIds: z.array(z.string().min(1)).min(1),
});

export type CreateCampaignInput = z.infer<typeof campaignSchema>;

export async function createCampaign(input: CreateCampaignInput): Promise<string> {
  const ctx = await requireWorkspace();
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Validierungsfehler: " + JSON.stringify(parsed.error.flatten()));
  }
  const data = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      workspaceId: ctx.workspaceId,
      name: data.name,
      description: data.description,
      heygenTemplateId: data.heygenTemplateId || null,
      heygenAvatarId: data.heygenAvatarId || null,
      heygenVoiceId: data.heygenVoiceId || null,
      scriptTemplate: data.scriptTemplate,
      landingpageHeadline: data.landingpageHeadline || null,
      landingpageTextTpl: data.landingpageTextTpl,
      emailSubjectTpl: data.emailSubjectTpl,
      emailBodyTpl: data.emailBodyTpl,
      bookingUrl: data.bookingUrl,
      ctaLabel: data.ctaLabel || "Jetzt Termin buchen",
      sendMode: data.sendMode,
      createdById: ctx.userId,
    },
  });

  // CampaignContacts anlegen - Platzhalter in Templates werden hier aufgeloest
  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: data.contactIds },
      workspaceId: ctx.workspaceId,
      optedOut: false,
    },
    include: { company: true },
  });

  const publicUrl = process.env.PUBLIC_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  for (const contact of contacts) {
    const slug = nanoid(12);
    const unsubscribeToken = nanoid(32);
    const vars = buildContactVars({
      contact,
      companyName: contact.company?.name,
      landingpageUrl: `${publicUrl}/p/${slug}`,
      bookingUrl: data.bookingUrl ?? "",
      unsubscribeUrl: `${publicUrl}/api/unsubscribe/${unsubscribeToken}`,
    });

    await prisma.campaignContact.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        slug,
        unsubscribeToken,
        personalizedScript: renderTemplate(data.scriptTemplate, vars),
        landingpageText: renderTemplate(data.landingpageTextTpl, vars),
        emailSubject: renderTemplate(data.emailSubjectTpl, vars),
        emailBody: renderTemplate(data.emailBodyTpl, vars),
      },
    });
  }

  revalidatePath("/app/campaigns");
  return campaign.id;
}

export async function startCampaign(campaignId: string) {
  const ctx = await requireWorkspace();
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId: ctx.workspaceId },
    include: { campaignContacts: { select: { id: true, videoStatus: true } } },
  });
  if (!campaign) throw new Error("Kampagne nicht gefunden");
  if (campaign.status === CampaignStatus.RUNNING) return;

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.RUNNING, startedAt: new Date() },
  });

  const queues = getQueues();
  for (const cc of campaign.campaignContacts) {
    if (cc.videoStatus === VideoStatus.READY || cc.videoStatus === VideoStatus.SKIPPED) continue;
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { videoStatus: VideoStatus.QUEUED },
    });
    await queues.video.add(
      "generate",
      { campaignContactId: cc.id },
      { attempts: 3, backoff: { type: "exponential", delay: 10_000 }, removeOnComplete: 1000, removeOnFail: 500 },
    );
  }

  revalidatePath(`/app/campaigns/${campaignId}`);
}

export async function pauseCampaign(campaignId: string) {
  const ctx = await requireWorkspace();
  await prisma.campaign.updateMany({
    where: { id: campaignId, workspaceId: ctx.workspaceId },
    data: { status: CampaignStatus.PAUSED },
  });
  revalidatePath(`/app/campaigns/${campaignId}`);
}

export async function deleteCampaign(campaignId: string) {
  const ctx = await requireWorkspace();
  await prisma.campaign.deleteMany({ where: { id: campaignId, workspaceId: ctx.workspaceId } });
  revalidatePath("/app/campaigns");
  redirect("/app/campaigns");
}
