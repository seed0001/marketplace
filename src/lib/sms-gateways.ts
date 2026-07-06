import { prisma } from "@/lib/prisma";
import { DEFAULT_SMS_GATEWAYS, type SmsGatewayOption } from "@/lib/sms-carriers";

// The carrier options shown to users. Reads the admin-managed catalog; when it
// hasn't been populated yet, falls back to the built-in defaults so the picker
// is never empty.
export async function getSmsGatewayOptions(): Promise<SmsGatewayOption[]> {
  const rows = await prisma.smsGateway.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { label: true, domain: true },
  });
  return rows.length > 0 ? rows : DEFAULT_SMS_GATEWAYS;
}
