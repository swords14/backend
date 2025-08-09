import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Listar todos os modelos
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.documentTemplate.findMany({ orderBy: { nome: 'asc' } });
    res.status(200).json(templates);
  } catch (error) {
    console.error("Erro ao buscar modelos:", error);
    res.status(500).json({ message: 'Erro ao buscar modelos.' });
  }
};

// Criar um novo modelo
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { nome, tipo, conteudo } = req.body;
    const newTemplate = await prisma.documentTemplate.create({
      data: { nome, tipo, conteudo },
    });
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Erro ao criar modelo:", error);
    res.status(500).json({ message: 'Erro ao criar modelo.' });
  }
};

// Atualizar um modelo
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nome, tipo, conteudo } = req.body;
        const updatedTemplate = await prisma.documentTemplate.update({
            where: { id: Number(id) },
            data: { nome, tipo, conteudo },
        });
        res.status(200).json(updatedTemplate);
    } catch (error) {
        console.error("Erro ao atualizar modelo:", error);
        res.status(500).json({ message: 'Erro ao atualizar modelo.' });
    }
};

// Excluir um modelo
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.documentTemplate.delete({ where: { id: Number(id) } });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error("Erro ao excluir modelo:", error);
        res.status(500).json({ message: 'Erro ao excluir modelo.' });
    }
};
