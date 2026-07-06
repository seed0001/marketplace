// Carrier email-to-SMS gateways. Sending a plain-text email to
// <10-digit-number>@<gateway-domain> is delivered to the handset as a text,
// letting us reuse the email provider for SMS. This module is intentionally
// free of server-only dependencies so it can be imported by client components
// (the carrier picker) as well as server code.
//
// The gateway *domain* is the source of truth we store per user — that's all we
// need to send. The admin-managed `SmsGateway` table (see lib/sms-gateways.ts)
// supplies the picker options; this list is only the built-in fallback used
// when that table is empty.

export type SmsGatewayOption = { label: string; domain: string };

export const DEFAULT_SMS_GATEWAYS: SmsGatewayOption[] = [
  { label: "Verizon", domain: "vtext.com" },
  { label: "AT&T", domain: "txt.att.net" },
  { label: "T-Mobile", domain: "tmomail.net" },
  { label: "Sprint", domain: "messaging.sprintpcs.com" },
  { label: "U.S. Cellular", domain: "email.uscc.net" },
  { label: "Cricket", domain: "sms.cricketwireless.net" },
  { label: "Boost Mobile", domain: "sms.myboostmobile.com" },
  { label: "Metro by T-Mobile", domain: "mymetropcs.com" },
  { label: "Google Fi", domain: "msg.fi.google.com" },
  { label: "Virgin Mobile", domain: "vmobl.com" },
];

// A conservative hostname check: dot-separated labels, a real TLD, no scheme,
// no "@", no path. Users may paste "@vtext.com" or "VText.com"; normalize first.
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function normalizeGatewayDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^mailto:/, "").replace(/^@/, "");
}

export function isValidGatewayDomain(value: unknown): value is string {
  return typeof value === "string" && DOMAIN_RE.test(normalizeGatewayDomain(value));
}
