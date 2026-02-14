import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string | number;
  details?: object;
  userId: number;
}

/**
 * Cria um registro no log de auditoria do sistema.
 * @param data - Os dados do log a serem criados.
 */
export const createAuditLog = async (data: AuditLogData) => {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        // Garante que o entityId seja sempre uma string, como o schema espera.
        entityId: String(data.entityId),
        details: data.details, // O Prisma já lida com 'undefined' corretamente.
        userId: data.userId,
      },
    });
  } catch (error) {
    console.error("Falha ao criar log de auditoria:", error);
  }
};