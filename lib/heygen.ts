// Minimaler HeyGen-API-Client.
// Siehe https://docs.heygen.com/

const DEFAULT_BASE = process.env.HEYGEN_API_BASE ?? "https://api.heygen.com";

export type HeygenGenerateInput = {
  apiKey: string;
  templateId?: string;
  avatarId?: string;
  voiceId?: string;
  script: string;
  callbackUrl?: string;
  callbackMeta?: Record<string, string>;
};

export type HeygenVideoStatus = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
};

function assertKey(key: string) {
  if (!key || key.length < 10) throw new Error("HeyGen-API-Key fehlt oder ungueltig");
}

/**
 * Startet die Video-Generierung. Gibt die HeyGen-video_id zurueck.
 * Wir unterstuetzen zwei Modi:
 *  - Wenn templateId gesetzt: v2/template/{id}/generate
 *  - Sonst: v2/video/generate mit avatar + voice
 */
export async function startHeygenVideo(input: HeygenGenerateInput): Promise<string> {
  assertKey(input.apiKey);
  const baseUrl = DEFAULT_BASE;
  const headers = {
    "X-Api-Key": input.apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (input.templateId) {
    // Template-basierte Generierung mit Variable "script"
    const res = await fetch(`${baseUrl}/v2/template/${input.templateId}/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        caption: false,
        title: `Kontaktmeister ${Date.now()}`,
        variables: {
          script: { name: "script", type: "text", properties: { content: input.script } },
        },
      }),
    });
    if (!res.ok) throw new Error(`HeyGen-Fehler (Template): ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data?: { video_id?: string }; video_id?: string };
    const videoId = body.data?.video_id ?? body.video_id;
    if (!videoId) throw new Error("HeyGen: keine video_id in Antwort");
    return videoId;
  }

  // Klassische avatar/voice-basierte Generierung
  if (!input.avatarId || !input.voiceId) {
    throw new Error("Entweder templateId oder (avatarId + voiceId) erforderlich");
  }

  const res = await fetch(`${baseUrl}/v2/video/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      test: false,
      caption: false,
      video_inputs: [
        {
          character: { type: "avatar", avatar_id: input.avatarId, avatar_style: "normal" },
          voice: { type: "text", voice_id: input.voiceId, input_text: input.script },
        },
      ],
      dimension: { width: 1280, height: 720 },
    }),
  });

  if (!res.ok) throw new Error(`HeyGen-Fehler (v2): ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data?: { video_id?: string } };
  const videoId = body.data?.video_id;
  if (!videoId) throw new Error("HeyGen: keine video_id in Antwort");
  return videoId;
}

export async function fetchHeygenStatus(apiKey: string, videoId: string): Promise<HeygenVideoStatus> {
  assertKey(apiKey);
  const res = await fetch(`${DEFAULT_BASE}/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HeyGen-Status-Fehler: ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      id?: string;
      status?: string;
      video_url?: string;
      thumbnail_url?: string;
      error?: { detail?: string; message?: string };
    };
  };
  const d = json.data ?? {};
  const statusStr = (d.status ?? "pending").toLowerCase();
  const status: HeygenVideoStatus["status"] =
    statusStr === "completed"
      ? "completed"
      : statusStr === "failed"
        ? "failed"
        : statusStr === "processing"
          ? "processing"
          : "pending";
  return {
    id: d.id ?? videoId,
    status,
    videoUrl: d.video_url,
    thumbnailUrl: d.thumbnail_url,
    error: d.error?.message ?? d.error?.detail,
  };
}
