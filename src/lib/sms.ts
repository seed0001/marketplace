import { isEmailConfigured, sendProviderEmail } from "@/lib/email";
import { isValidGatewayDomain, normalizeGatewayDomain } from "@/lib/sms-carriers";

type SmsResult = {
  status: "sent" | "skipped" | "failed";
  providerId?: string;
  error?: string;
};

// Carrier gateways address the handset by its 10-digit US number, without the
// country code. Strip everything non-numeric and drop a leading US "1".
function gatewayDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return local.length === 10 ? local : null;
}

// SMS now rides on the email provider, so it is "configured" whenever email is.
export function isSmsConfigured() {
  return isEmailConfigured();
}

// `gatewayDomain` is the carrier's email-to-SMS host stored on the user
// (e.g. "vtext.com") — whether picked from the catalog or entered by hand.
export async function sendSmsNotification(
  to: string | null,
  gatewayDomain: string | null,
  subject: string,
  body: string
): Promise<SmsResult> {
  if (!to) return { status: "skipped", error: "No phone number" };

  if (!gatewayDomain || !isValidGatewayDomain(gatewayDomain)) {
    return { status: "skipped", error: "No carrier gateway set for this number" };
  }
  const gateway = normalizeGatewayDomain(gatewayDomain);

  const digits = gatewayDigits(to);
  if (!digits) return { status: "skipped", error: "Phone number is not a 10-digit US number" };

  // Keep it short — carrier gateways split or truncate long messages. The
  // subject carries the title; gateways that surface it show "title + body",
  // and those that drop it still deliver the body.
  return sendProviderEmail({
    to: `${digits}@${gateway}`,
    subject,
    text: body.slice(0, 1200),
  });
}
