import { prisma } from "../lib/db";
import { getQueues } from "../lib/queue";
import { startHeygenVideo } from "../lib/heygen";
import { getApiKey, heygenKeyFor } from "../lib/api-keys";
import { VideoStatus } from "@prisma/client";

export async function processVideoJob(data: { campaignContactId: string }) {
  const cc = await prisma.campaignContact.findUnique({
    where: { id: data.campaignContactId },
    include: { campaign: true },
  });
  if (!cc) throw new Error(`CampaignContact ${data.campaignContactId} nicht gefunden`);

  const workspaceKey = await getApiKey(cc.campaign.workspaceId, "HEYGEN");
  const apiKey = heygenKeyFor(workspaceKey);
  if (!apiKey) {
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: {
        videoStatus: VideoStatus.FAILED,
        videoError: "Kein HeyGen-API-Key im Workspace oder global gesetzt.",
      },
    });
    return;
  }

  await prisma.campaignContact.update({
    where: { id: cc.id },
    data: { videoStatus: VideoStatus.PROCESSING },
  });

  try {
    const videoId = await startHeygenVideo({
      apiKey,
      templateId: cc.campaign.heygenTemplateId ?? undefined,
      avatarId: cc.campaign.heygenAvatarId ?? undefined,
      voiceId: cc.campaign.heygenVoiceId ?? undefined,
      script: cc.personalizedScript,
    });

    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { heygenVideoId: videoId },
    });

    // Starte Polling-Job mit 30s Delay - HeyGen-Videos brauchen idR 1-3 Minuten
    const queues = getQueues();
    await queues.videoPoll.add(
      "poll",
      { campaignContactId: cc.id },
      { delay: 30_000, attempts: 40, backoff: { type: "fixed", delay: 30_000 } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { videoStatus: VideoStatus.FAILED, videoError: msg },
    });
    throw err;
  }
}
