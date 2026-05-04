import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type AuditLogInput = {
  userId?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        targetId: input.targetId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Ignore audit log failures to avoid blocking main flows.
  }
}
