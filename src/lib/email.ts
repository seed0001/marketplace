type EmailResult = {
  status: "sent" | "skipped" | "failed";
  providerId?: string;
  error?: string;
};

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isEmailConfigured() {
  return Boolean(emailConfig());
}

export async function sendEmailNotification(to: string | null, subject: string, body: string): Promise<EmailResult> {
  if (!to) return { status: "skipped", error: "No email address" };
  const config = emailConfig();
  if (!config) return { status: "skipped", error: "Email provider is not configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to,
        subject,
        text: body,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><h1 style="font-size:20px">${escapeHtml(subject)}</h1><p style="white-space:pre-wrap">${escapeHtml(body)}</p></div>`,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { status: "failed", error: data.message || data.error || `Email provider returned ${response.status}` };
    }
    return { status: "sent", providerId: typeof data.id === "string" ? data.id : undefined };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "Email delivery failed" };
  }
}
