// Einfaches HTML-Mail-Template als String-Builder (kein react-email,
// um Build-Komplexitaet gering zu halten und zuverlaessig in jedem Client zu rendern).

type EmailInput = {
  subject: string;
  body: string;
  recipientName: string;
  workspaceName: string;
  landingUrl: string;
  unsubscribeUrl: string;
  openPixelUrl: string;
  appUrl: string;
  campaignContactId: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rewriteLinks(body: string, appUrl: string, ccId: string): string {
  // Ersetzt http(s)://... durch Click-Tracking-URLs, ausser der Landing- und Unsubscribe-URL
  return body.replace(/\b(https?:\/\/[^\s<>"']+)/g, (match) => {
    if (match.includes("/api/unsubscribe/") || match.includes("/api/track/")) return match;
    return `${appUrl}/api/track/click?cc=${ccId}&type=link&url=${encodeURIComponent(match)}`;
  });
}

export function renderCampaignEmail(input: EmailInput): { html: string; text: string } {
  const bodyTracked = rewriteLinks(input.body, input.appUrl, input.campaignContactId);

  const paragraphs = bodyTracked
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.55">${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(input.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1b2333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e9ef">
        <tr><td style="padding:24px 28px;">
          ${paragraphs}
          <div style="margin:24px 0;">
            <a href="${esc(input.landingUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Persoenliches Video ansehen</a>
          </div>
          <hr style="border:none;border-top:1px solid #e6e9ef;margin:28px 0" />
          <p style="font-size:12px;color:#8a94a6;margin:0 0 8px 0">
            Diese Mail wurde persoenlich fuer ${esc(input.recipientName)} versendet.
          </p>
          <p style="font-size:12px;color:#8a94a6;margin:0">
            Du moechtest keine weiteren Mails? <a href="${esc(input.unsubscribeUrl)}" style="color:#8a94a6">Hier abmelden</a> &middot; Anbieter: ${esc(input.workspaceName)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  <img src="${esc(input.openPixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px" />
</body></html>`;

  const text = `${input.body}\n\nPersoenliches Video: ${input.landingUrl}\n\n---\nAbmelden: ${input.unsubscribeUrl}`;

  return { html, text };
}

export function renderCampaignEmailText(input: EmailInput): string {
  return renderCampaignEmail(input).text;
}
