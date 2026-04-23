import { prisma } from "../lib/db";
import { getQueues } from "../lib/queue";
import { fetchHeygenStatus } from "../lib/heygen";
import { getApiKey, heygenKeyFor } from "../lib/api-keys";
import { VideoStatus, CampaignStatus, SendMode } from "@prisma/client";

export async function processVideoPollJob(data: { campaignContactId: string }) {
  const cc = await prisma.campaignContact.findUnique({
    where: { id: data.campaignContactId },
    include: { campaign: true },
  });
  if (!cc?.heygenVideoId) return;
  if (cc.videoStatus === VideoStatus.READY) return;

  const workspaceKey = await getApiKey(cc.campaign.workspaceId, "HEYGEN");
  const apiKey = heygenKeyFor(workspaceKey);
  if (!apiKey) return;

  const status = await fetchHeygenStatus(apiKey, cc.heygenVideoId);

  if (status.status === "completed" && status.videoUrl) {
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: {
        videoStatus: VideoStatus.READY,
        videoUrl: status.videoUrl,
        videoThumbnail: status.thumbnailUrl,
      },
    });

    // Versand queuen (wenn Campaign noch aktiv ist)
    if (
      cc.campaign.status === CampaignStatus.RUNNING ||
      cc.campaign.status === CampaignStatus.SCHEDULED
    ) {
      const queues = getQueues();
      if (cc.campaign.sendMode === SendMode.EMAIL || cc.campaign.sendMode === SendMode.BOTH) {
        await queues.mail.add(
          "send",
          { campaignContactId: cc.id },
          { attempts: 3, backoff: { type: "exponential", delay: 30_000 } },
        );
      }
    }

    await maybeCompleteCampaign(cc.campaignId);
    return;
  }

  if (status.status === "failed") {
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: {
        videoStatus: VideoStatus.FAILED,
        videoError: status.error ?? "HeyGen meldet Fehler",
      },
    });
    return;
  }

  // Noch nicht fertig -> erneut pollen
  throw new Error("Noch nicht fertig"); // BullMQ-Retry mit backoff
}

async function maybeCompleteCampaign(campaignId: string) {
  const [pending, campaign] = await Promise.all([
    prisma.campaignContact.count({
      where: {
        campaignId,
        OR: [{ videoStatus: VideoStatus.PENDING }, { videoStatus: VideoStatus.PROCESSING }, { videoStatus: VideoStatus.QUEUED }],
      },
    }),
    prisma.campaign.findUnique({ where: { id: campaignId } }),
  ]);
  if (pending === 0 && campaign?.status === CampaignStatus.RUNNING) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.DONE, completedAt: new Date() },
    });
  }
}
