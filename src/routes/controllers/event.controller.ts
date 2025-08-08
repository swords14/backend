// Caminho: backend/src/routes/controllers/event.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../controllers/audit.service'; // Importa o serviço de auditoria

const prisma = new PrismaClient();

// Listar todos os eventos
export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        client: { select: { id: true, nome: true } },
        tasks: true,
        staff: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                role: { select: { id: true, name: true } }
              }
            }
          }
        },
        eventItems: { include: { inventoryItem: true } } // NOVO: Incluir inventoryItem para mostrar nome no frontend
      },
    });
    res.status(200).json(events);
  } catch (error: any) { // Adicionado ': any'
    console.error("Erro ao buscar eventos:", error);
    res.status(500).json({ message: 'Erro ao buscar eventos.', error: error.message }); // Mais detalhes no erro
  }
};

// Criar um novo evento
export const createEvent = async (req: Request, res: Response) => {
  const { 
    title, startDate, endDate, convidados, valorTotal, status, observacoes, clientId, tasks, staff, eventItems,
    // NOVOS CAMPOS DO MODELO EVENT
    eventType, eventTheme,
    localNome, localEndereco, localCidade, localEstado, localCEP,
    setupDate, setupTimeStart, setupTimeEnd,
    teardownDate, teardownTimeStart, teardownTimeEnd,
    specificRequirements,
    eventContactName, eventContactPhone, eventContactEmail
  } = req.body;

  try {
    if (!req.user || !req.user.id) {
        console.error("Tentativa de criar evento sem autenticação.");
        return res.status(401).json({ message: "Não autorizado: usuário não identificado." });
    }
    
    // Validações e conversões de data/números
    const parsedClientId = Number(clientId);
    if (isNaN(parsedClientId)) return res.status(400).json({ message: "ID do cliente inválido." });

    const parsedConvidados = Number(convidados);
    if (isNaN(parsedConvidados)) return res.status(400).json({ message: "Número de convidados inválido." });

    const parsedValorTotal = parseFloat(valorTotal);
    if (isNaN(parsedValorTotal)) return res.status(400).json({ message: "Valor total inválido." });

    const newEvent = await prisma.event.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        convidados: parsedConvidados,
        valorTotal: parsedValorTotal,
        status,
        observacoes,
        clientId: parsedClientId,
        tasks: {
          create: tasks?.map((t: { id: string, descricao: string, concluida?: boolean }) => ({ descricao: t.descricao, concluida: t.concluida || false })) || [],
        },
        staff: {
          create: staff?.map((s: { userId: number }) => ({ userId: Number(s.userId) })) || [], // Garante que userId é Number
        },
        eventItems: {
          create: eventItems?.map((item: { inventoryItemId: number, quantidadeReservada: number }) => ({
            inventoryItemId: Number(item.inventoryItemId), // Garante que inventoryItemId é Number
            quantidadeReservada: Number(item.quantidadeReservada),
          })) || [],
        },
        // NOVOS CAMPOS PERSISTIDOS
        eventType, 
        eventTheme,
        localNome, 
        localEndereco, 
        localCidade, 
        localEstado, 
        localCEP,
        setupDate: setupDate ? new Date(setupDate) : null, // Converte para Date ou null
        setupTimeStart, 
        setupTimeEnd,
        teardownDate: teardownDate ? new Date(teardownDate) : null, // Converte para Date ou null
        teardownTimeStart, 
        teardownTimeEnd,
        specificRequirements,
        eventContactName, 
        eventContactPhone, 
        eventContactEmail,
      },
      include: {
        client: true,
        tasks: true,
        staff: { include: { user: true } },
        eventItems: true,
      },
    });

    await createAuditLog({
        action: 'CREATE',
        entityType: 'Event',
        entityId: newEvent.id,
        userId: Number(req.user.id),
        details: { title: newEvent.title, clientId: newEvent.clientId, status: newEvent.status, type: newEvent.eventType }
    });

    res.status(201).json(newEvent);
  } catch (error: any) {
    console.error("Erro ao criar evento:", error);
    res.status(500).json({ message: 'Erro ao criar evento.', error: error.message });
  }
};

// Atualizar um evento
export const updateEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    title, startDate, endDate, convidados, valorTotal, status, observacoes, clientId, tasks, staff, eventItems,
    // NOVOS CAMPOS DO MODELO EVENT
    eventType, eventTheme,
    localNome, localEndereco, localCidade, localEstado, localCEP,
    setupDate, setupTimeStart, setupTimeEnd,
    teardownDate, teardownTimeStart, teardownTimeEnd,
    specificRequirements,
    eventContactName, eventContactPhone, eventContactEmail
  } = req.body;

  try {
    if (!req.user || !req.user.id) {
        console.error("Tentativa de atualizar evento sem autenticação.");
        return res.status(401).json({ message: "Não autorizado: usuário não identificado." });
    }

    const eventBeforeUpdate = await prisma.event.findUnique({ where: { id } });
    if (!eventBeforeUpdate) {
        return res.status(404).json({ message: "Evento não encontrado." });
    }

    // Validações e conversões de data/números
    const parsedClientId = Number(clientId);
    if (isNaN(parsedClientId)) return res.status(400).json({ message: "ID do cliente inválido." });

    const parsedConvidados = Number(convidados);
    if (isNaN(parsedConvidados)) return res.status(400).json({ message: "Número de convidados inválido." });

    const parsedValorTotal = parseFloat(valorTotal);
    if (isNaN(parsedValorTotal)) return res.status(400).json({ message: "Valor total inválido." });

    const updatedEvent = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          title,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          convidados: parsedConvidados,
          valorTotal: parsedValorTotal,
          status,
          observacoes,
          clientId: parsedClientId,
          // NOVOS CAMPOS PERSISTIDOS
          eventType, 
          eventTheme,
          localNome, 
          localEndereco, 
          localCidade, 
          localEstado, 
          localCEP,
          setupDate: setupDate ? new Date(setupDate) : null,
          setupTimeStart, 
          setupTimeEnd,
          teardownDate: teardownDate ? new Date(teardownDate) : null,
          teardownTimeStart, 
          teardownTimeEnd,
          specificRequirements,
          eventContactName, 
          eventContactPhone, 
          eventContactEmail,
        },
      });

      // Atualiza Tarefas
      await tx.eventTask.deleteMany({ where: { eventId: id } });
      if (tasks && tasks.length > 0) {
        await tx.eventTask.createMany({
          data: tasks.map((t: { id: string, descricao: string, concluida?: boolean }) => ({ descricao: t.descricao, concluida: t.concluida || false, eventId: id })),
        });
      }

      // Atualiza Equipe
      await tx.eventStaff.deleteMany({ where: { eventId: id } });
      if (staff && staff.length > 0) {
        await tx.eventStaff.createMany({
          data: staff.map((s: { userId: number }) => ({ eventId: id, userId: Number(s.userId) })), // Garante que userId é Number
        });
      }

      // Atualiza Itens de Evento
      await tx.eventItem.deleteMany({ where: { eventId: id } });
      if (eventItems && eventItems.length > 0) {
        await tx.eventItem.createMany({
          data: eventItems.map((item: { inventoryItemId: number, quantidadeReservada: number }) => ({
            eventId: id,
            inventoryItemId: Number(item.inventoryItemId), // Garante que inventoryItemId é Number
            quantidadeReservada: Number(item.quantidadeReservada),
          })),
        });
      }

      return tx.event.findUnique({
        where: { id },
        include: { client: true, tasks: true, staff: { include: { user: true } }, eventItems: true },
      });
    });

    if (eventBeforeUpdate) {
        await createAuditLog({
            action: 'UPDATE',
            entityType: 'Event',
            entityId: id,
            userId: Number(req.user.id),
            details: {
                before: { title: eventBeforeUpdate.title, status: eventBeforeUpdate.status, type: eventBeforeUpdate.eventType },
                after: { title: updatedEvent?.title, status: updatedEvent?.status, type: updatedEvent?.eventType }
            }
        });
    }

    res.status(200).json(updatedEvent);
  } catch (error: any) {
    console.error("Erro ao atualizar evento:", error);
    res.status(500).json({ message: 'Erro ao atualizar evento.', error: error.message });
  }
};

// Apagar um evento
export const deleteEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!req.user || !req.user.id) {
        console.error("Tentativa de apagar evento sem autenticação.");
        return res.status(401).json({ message: "Não autorizado: usuário não identificado." });
    }

    const eventToDelete = await prisma.event.findUnique({ where: { id } });

    if (!eventToDelete) {
        return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventTask.deleteMany({ where: { eventId: id } });
      await tx.eventStaff.deleteMany({ where: { eventId: id } });
      await tx.eventItem.deleteMany({ where: { eventId: id } });
      await tx.transaction.deleteMany({ where: { eventId: id }});
      await tx.feedback.deleteMany({ where: { eventId: id }});
      await tx.event.delete({ where: { id } });
    });

    await createAuditLog({
        action: 'DELETE',
        entityType: 'Event',
        entityId: id,
        userId: Number(req.user.id),
        details: { title: eventToDelete.title, status: eventToDelete.status, clientId: eventToDelete.clientId, type: eventToDelete.eventType }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao apagar evento:", error);
    res.status(500).json({ message: 'Erro ao apagar evento.', error: error.message });
  }
};

// Cria um novo evento a partir de um orçamento existente.
export const createEventFromBudget = async (req: Request, res: Response) => {
    const { budgetId } = req.body;

    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Não autorizado: usuário não identificado." });
    }

    if (!budgetId) {
        return res.status(400).json({ message: 'O ID do orçamento é obrigatório.' });
    }

    try {
        // 1. Busca o orçamento completo
        const budget = await prisma.budget.findUnique({
            where: { id: budgetId },
            include: {
                client: true,
                items: true, // Incluir itens do orçamento para mapear para eventItems
            },
        });

        if (!budget) {
            return res.status(404).json({ message: 'Orçamento não encontrado.' });
        }

        // 2. Cria o novo evento mapeando os dados do orçamento e seus itens
        const newEvent = await prisma.event.create({
            data: {
                title: budget.eventName || `Evento para ${budget.client.nome}`,
                startDate: budget.eventDate || new Date(),
                // Ajustando endDate para ser 4 horas depois de startDate se não houver no orçamento
                endDate: budget.eventDate ? new Date(new Date(budget.eventDate).setHours(new Date(budget.eventDate).getHours() + 4)) : null,
                convidados: budget.convidados || 0,
                valorTotal: budget.valorTotal,
                status: 'PLANEJADO', // Status inicial do evento
                observacoes: budget.observacoes,
                clientId: budget.clientId,
                // Mapeando NOVOS campos do orçamento para o evento, se existirem
                eventType: budget.tipoCozinha || null, // Usando tipoCozinha como tipo de evento inicial
                localNome: budget.localEventoNome || null,
                localEndereco: budget.localEventoEndereco || null,
                localCidade: budget.localEventoCidade || null,
                localEstado: budget.localEventoEstado || null,
                localCEP: budget.localEventoCEP || null,
                specificRequirements: budget.restricoesAlimentares || null,
                // Contato do evento - pode ser mapeado do cliente se não houver um campo específico no orçamento
                eventContactName: budget.client?.nome || null,
                eventContactPhone: budget.client?.telefone || null,
                eventContactEmail: budget.client?.email || null,

                // Mapeia itens do orçamento para eventItems
                eventItems: {
                    create: budget.items.map((item: any) => ({
                        inventoryItemId: item.id, // ATENÇÃO: Se o ID do BudgetItem for o ID do InventoryItem, ok.
                                                 // Senão, você precisa de um campo 'inventoryItemId' no BudgetItem.
                        quantidadeReservada: item.quantidade,
                    })),
                },
            },
        });

        // 3. Cria um log de auditoria para a conversão
        await createAuditLog({
            action: 'CREATE_FROM_BUDGET',
            entityType: 'Event',
            entityId: newEvent.id,
            userId: Number(req.user.id),
            details: {
                title: newEvent.title,
                sourceBudgetId: budgetId,
                status: newEvent.status,
                type: newEvent.eventType
            }
        });

        res.status(201).json(newEvent);
    } catch (error: any) {
        console.error("Erro ao converter orçamento para evento:", error);
        res.status(500).json({ message: 'Erro interno ao converter orçamento.', error: error.message });
    }
};

// ** NOVO CONTROLADOR: Função para finalizar um evento **
export const finalizeEvent = async (req: Request, res: Response) => {
    const { eventId } = req.params;

    try {
        const event = await prisma.event.update({
            where: { id: eventId },
            data: { status: 'FINALIZADO' },
        });

        await createAuditLog({
            action: 'UPDATE',
            entityType: 'Event',
            entityId: eventId,
            userId: req.user!.id,
            details: { newStatus: 'FINALIZADO' }
        });

        res.status(200).json(event);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao finalizar o evento.", error: error.message });
    }
};