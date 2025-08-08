// Caminho: backend/src/controllers/feedback.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from './audit.service';

const prisma = new PrismaClient();

// Lista todos os eventos que estão finalizados, com o status de feedback
export const getEventsForFeedback = async (req: Request, res: Response) => {
    try {
        // CORREÇÃO: Encontra todos os eventos com status 'FINALIZADO'
        const events = await prisma.event.findMany({
            where: { status: 'FINALIZADO' },
            select: {
                id: true,
                title: true,
                client: { select: { nome: true, email: true } },
                feedbacks: { select: { id: true, sugestao: true, autorizaDepoimento: true, notasJson: true } },
            }
        });

        const eventsWithFeedbackStatus = events.map(event => {
            const feedbackRecord = event.feedbacks[0];
            let feedbackStatus;
            let feedbackId;
            let depoimento = false;
            let feedbackData = null;

            if (feedbackRecord) {
                // Se o feedback tem notas, ele foi recebido
                const notas = JSON.parse(feedbackRecord.notasJson);
                if (Object.keys(notas).length > 0) {
                    feedbackStatus = 'Recebido';
                    depoimento = feedbackRecord.autorizaDepoimento;
                    feedbackData = feedbackRecord;
                } else {
                    // Se o feedback existe mas está vazio, o link foi enviado
                    feedbackStatus = 'Pendente';
                }
                feedbackId = feedbackRecord.id;
            } else {
                feedbackStatus = 'Não Enviado';
            }

            return {
                id: event.id,
                title: event.title,
                cliente: event.client,
                feedbackStatus,
                feedbackId,
                depoimento,
                feedbackData,
            };
        });

        res.status(200).json(eventsWithFeedbackStatus);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao buscar eventos para feedback.", error: error.message });
    }
};

// ... (Resto do controlador, sem alterações)
export const createFeedbackRecord = async (req: Request, res: Response) => {
    const { eventId } = req.body;
    if (!eventId) {
        return res.status(400).json({ message: "ID do evento é obrigatório." });
    }

    try {
        const existingFeedback = await prisma.feedback.findUnique({ where: { eventId } });
        if (existingFeedback) {
            return res.status(200).json(existingFeedback);
        }

        const newFeedback = await prisma.feedback.create({
            data: {
                event: { connect: { id: eventId } },
                notasJson: JSON.stringify({}),
                sugestao: '',
            }
        });
        
        await createAuditLog({
            action: 'CREATE',
            entityType: 'Feedback',
            entityId: newFeedback.id,
            userId: req.user!.id,
            details: { eventId }
        });

        res.status(201).json(newFeedback);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao criar registro de feedback.", error: error.message });
    }
};

export const getFeedbackById = async (req: Request, res: Response) => {
    const { feedbackId } = req.params;
    try {
        const feedback = await prisma.feedback.findUnique({
            where: { id: feedbackId },
            include: { event: { select: { title: true, client: true } } }
        });
        if (!feedback) {
            return res.status(404).json({ message: "Feedback não encontrado." });
        }
        res.status(200).json(feedback);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao buscar feedback.", error: error.message });
    }
};

export const submitFeedback = async (req: Request, res: Response) => {
    const { feedbackId } = req.params;
    const { notas, sugestao, autorizacao } = req.body;

    if (!notas) {
        return res.status(400).json({ message: "Notas de avaliação são obrigatórias." });
    }

    try {
        const updatedFeedback = await prisma.feedback.update({
            where: { id: feedbackId },
            data: {
                notasJson: JSON.stringify(notas),
                sugestao: sugestao || '',
                autorizaDepoimento: autorizacao,
            }
        });
        
        res.status(200).json({ message: "Feedback recebido com sucesso!" });
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao enviar feedback.", error: error.message });
    }
};