import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

// A assinatura da função agora usa o 'Request' padrão do Express
export const getAuditLogs = async (req: Request, res: Response) => {
  // O middleware 'protect' garante que 'req.user' existirá aqui.
  // Esta verificação serve como uma segurança extra e como um "type guard" para o TypeScript.
  if (!req.user) {
    return res.status(401).json({ message: 'Não autorizado. Usuário não encontrado na requisição.' });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            nome: true,
          },
        },
      },
    });

    const totalLogs = await prisma.auditLog.count();

    res.status(200).json({
      data: logs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar logs de auditoria.', error });
  }
};