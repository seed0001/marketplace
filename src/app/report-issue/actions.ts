"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type IssueFormState = {
  success: boolean;
  message: string;
  reference?: string;
  errors?: Partial<Record<"affectedPage" | "description" | "contact", string[]>>;
};

const issueSchema = z.object({
  affectedPage: z.string().trim().min(2, "Tell us which page or feature was affected.").max(300),
  description: z.string().trim().min(10, "Please give us at least a little detail about what happened.").max(5000),
  contact: z.string().trim().min(3, "Please provide a way for us to contact you.").max(300),
  website: z.string().max(0),
});

export async function submitIssue(
  _previousState: IssueFormState,
  formData: FormData,
): Promise<IssueFormState> {
  const parsed = issueSchema.safeParse({
    affectedPage: formData.get("affectedPage"),
    description: formData.get("description"),
    contact: formData.get("contact"),
    website: formData.get("website"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Check the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const session = await auth();
  const requestHeaders = await headers();
  const report = await prisma.siteIssueReport.create({
    data: {
      affectedPage: parsed.data.affectedPage,
      description: parsed.data.description,
      contact: parsed.data.contact,
      reporterId: session?.user?.id || null,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 1000) || null,
    },
    select: { id: true },
  });

  return {
    success: true,
    message: "Your issue has been sent to the VibeMarket team.",
    reference: `VM-${report.id.slice(-8).toUpperCase()}`,
  };
}
