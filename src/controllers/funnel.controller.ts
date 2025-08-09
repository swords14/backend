// Caminho: backend/src/controllers/funnel.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prisma = new PrismaClient();

const getPeriodDates = (periodo: string) => {
    const now = new Date();
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;

    switch (periodo) {
        case 'hoje':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
        case 'esta-semana':
            startDate = startOfWeek(now, { locale: ptBR, weekStartsOn: 1 });
            endDate = endOfWeek(now, { locale: ptBR, weekStartsOn: 1 });
            break;
        case 'este-mes':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        default:
            break;
    }
    return { startDate, endDate };
};

export const getFunnelData = async (req: Request, res: Response) => {
  try {
    const { responsavelId, periodo } = req.query;
    const { startDate, endDate } = getPeriodDates(periodo as string);

    const whereClause: any = {
      status: { in: ['Orçamento Enviado', 'Follow-up', 'Em Negociação', 'Aprovado', 'Recusado'] },
    };

    if (responsavelId && responsavelId !== 'todos') {
      // Note: O modelo Budget não tem um campo 'responsavelId' direto.
      // Assumindo que a responsabilidade está em uma tabela relacionada ou em um campo 'userId'
      // Se a responsabilidade estiver no modelo Budget, ajuste o where aqui.
      // Exemplo: whereClause.responsavelId = Number(responsavelId);
    }
    
    if (startDate && endDate) {
        whereClause.eventDate = {
            gte: startDate,
            lte: endDate,
        };
    }

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      include: {
        client: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    
    const groupedBudgets = budgets.reduce((acc, budget) => {
      acc[budget.status] = acc[budget.status] || { items: [] };
      acc[budget.status].items.push(budget);
      return acc;
    }, {} as any);

    res.status(200).json(groupedBudgets);

  } catch (error) {
    console.error("Erro ao buscar dados do funil:", error);
    res.status(500).json({ message: 'Erro ao buscar dados do funil.' });
  }
};