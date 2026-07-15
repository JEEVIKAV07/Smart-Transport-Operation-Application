import { prisma } from '../config/database';

export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes: changes as object,
      },
    });
  } catch {
    // Audit log failure should never break business logic
    console.error('Failed to create audit log');
  }
}
