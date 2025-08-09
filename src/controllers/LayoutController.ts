import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const LayoutController = {
  // Criar um novo template de layout
  create: async (req: Request, res: Response) => {
    try {
      const { name, layoutJson } = req.body;
      if (!name || !layoutJson) {
        return res.status(400).json({ error: 'Nome e layoutJson são obrigatórios' });
      }
      const newLayout = await prisma.layoutTemplate.create({
        data: { name, layoutJson },
      });
      res.status(201).json(newLayout);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao criar layout' });
    }
  },

  // Listar todos os layouts
  list: async (req: Request, res: Response) => {
    try {
      const layouts = await prisma.layoutTemplate.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(layouts);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar layouts' });
    }
  },
  
  // Buscar um layout por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const layout = await prisma.layoutTemplate.findUnique({ where: { id } });
      if (!layout) {
        return res.status(404).json({ error: 'Layout não encontrado' });
      }
      res.status(200).json(layout);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar layout' });
    }
  },

  // Atualizar um layout
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, layoutJson } = req.body;
      const updatedLayout = await prisma.layoutTemplate.update({
        where: { id },
        data: { name, layoutJson },
      });
      res.status(200).json(updatedLayout);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao atualizar layout' });
    }
  },
};