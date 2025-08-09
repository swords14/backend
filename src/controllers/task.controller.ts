// Caminho: backend/src/controllers/task.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client'; // CORREÇÃO: Adicionada a importação de 'Prisma'

const prisma = new PrismaClient();

// CORREÇÃO: Adicionada a interface para tipar o objeto de requisição
interface AuthenticatedRequest extends Request {
    user?: { id: number; role: string };
}

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, status, priority, dueDate, assignedToId, clientId, eventId, tags, subTasks } = req.body;

    if (!title || !assignedToId) {
        return res.status(400).json({ message: 'Título e usuário responsável são obrigatórios.' });
    }

    try {
        const data: any = {
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            tags: tags || [],
            eventId,
            subTasks: {
                create: subTasks?.map((sub: { text: string, isDone: boolean }) => ({ text: sub.text, isDone: sub.isDone })) || []
            }
        };
        if (assignedToId !== undefined && assignedToId !== null) {
            data.assignedToId = Number(assignedToId);
        }
        if (clientId !== undefined && clientId !== null) {
            data.clientId = Number(clientId);
        }

        const newTask = await prisma.task.create({
            data,
            include: { subTasks: true }
        });
        res.status(201).json(newTask);
    } catch (error: any) {
        console.error("Erro ao criar tarefa:", error);
        res.status(500).json({ message: 'Erro ao criar tarefa.', error: error.message });
    }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedToId, clientId, eventId, tags, subTasks } = req.body;

    try {
        await prisma.subTask.deleteMany({
            where: { taskId: Number(id) }
        });

        const updatedTask = await prisma.task.update({
            where: { id: Number(id) },
            data: {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                tags: tags || [],
                assignedToId: assignedToId ? Number(assignedToId) : undefined,
                clientId: clientId ? Number(clientId) : undefined,
                eventId,
                subTasks: {
                    create: subTasks?.map((sub: { text: string, isDone: boolean }) => ({ text: sub.text, isDone: sub.isDone })) || []
                }
            },
            include: { subTasks: true }
        });
        res.status(200).json(updatedTask);
    } catch (error: any) {
        console.error("Erro ao atualizar tarefa:", error);
        res.status(500).json({ message: 'Erro ao atualizar tarefa.', error: error.message });
    }
};

export const getAllTasks = async (req: Request, res: Response) => {
    try {
        const { searchTerm, statusFilter } = req.query;
        let whereClause: Prisma.TaskWhereInput = {}; // CORREÇÃO: Usa o tipo importado 'Prisma'

        if (statusFilter && statusFilter !== 'Todos') {
            whereClause.status = statusFilter as string;
        }

        if (searchTerm) {
            whereClause.title = {
                contains: searchTerm as string,
                mode: 'insensitive'
            };
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignedTo: { select: { nome: true } },
                client: { select: { nome: true } },
                subTasks: true,
            },
            orderBy: { dueDate: 'asc' }
        });
        res.status(200).json(tasks);
    } catch (error: any) {
        res.status(500).json({ message: 'Erro ao buscar tarefas.', error: error.message });
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const task = await prisma.task.findUnique({
            where: { id: Number(id) },
             include: {
                assignedTo: true,
                client: true,
                event: true,
                subTasks: true,
            },
        });
        if (!task) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        res.status(200).json(task);
    } catch (error: any) {
        res.status(500).json({ message: 'Erro ao buscar tarefa.', error: error.message });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.task.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: 'Erro ao deletar tarefa.', error: error.message });
    }
};