import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para buscar eventos para o calendário da equipe
export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    console.log("--- INÍCIO getCalendarEvents NO BACKEND ---");
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        client: { select: { id: true, nome: true } },
        staff: {
          // Garante que o usuário (User) associado ao EventStaff é incluído
          include: {
            user: { // Seleciona explicitamente os campos do usuário necessários
              select: {
                id: true,
                nome: true,
                email: true,
                role: { select: { id: true, name: true } }
              }
            }
          }
        },
      },
    });

    console.log("Eventos encontrados pelo Prisma (dentro do backend):");
    console.log(JSON.stringify(events, null, 2)); 
    console.log("Número de eventos encontrados:", events.length);
    console.log("--- FIM getCalendarEvents NO BACKEND ---");

    res.status(200).json(events);
  } catch (error) {
    console.error("Erro ao buscar eventos para o calendário NO BACKEND:", error);
    res.status(500).json({ message: 'Erro ao buscar eventos para o calendário.' });
  }
};

// Função para buscar reservas de itens para eventos futuros (movida de event.controller)
export const getFutureEventItemReservations = async (req: Request, res: Response) => {
  try {
    const reservations = await prisma.eventItem.findMany({
      where: {
        event: {
          startDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
      select: {
        quantidadeReservada: true,
        inventoryItemId: true,
        eventId: true,
      },
    });

    const aggregatedReservations = reservations.reduce((acc: { [key: number]: number }, reservation) => {
      acc[reservation.inventoryItemId] = (acc[reservation.inventoryItemId] || 0) + reservation.quantidadeReservada;
      return acc;
    }, {});

    res.status(200).json(aggregatedReservations);
  } catch (error) {
    console.error('Erro ao buscar reservas de eventos (do calendário):', error);
    res.status(500).json({ message: 'Erro ao buscar reservas de eventos.' });
  }
};