type SmsResult = {
  status: "sent" | "skipped" | "failed";
  providerId?: string;
  error?: string;
};

function smsConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) return null;
  return { accountSid, authToken, from };
}

export function isSmsConfigured() {
  return Boolean(smsConfig());
}

export async function sendSmsNotification(to: string | null, body: string): Promise<SmsResult> {
  if (!to) return { status: "skipped", error: "No phone number" };
  const config = smsConfig();
  if (!config) return { status: "skipped", error: "SMS provider is not configured" };

  try {
    const params = new URLSearchParams({
      To: to,
      From: config.from,
      Body: body.slice(0, 1500),
    });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { status: "failed", error: data.message || `SMS provider returned ${response.status}` };
    }
    return { status: "sent", providerId: typeof data.sid === "string" ? data.sid : undefined };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "SMS delivery failed" };
  }
}
