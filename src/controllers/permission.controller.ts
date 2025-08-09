import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Lista todas as permissões disponíveis no sistema
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { subject: 'asc' }
    });
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar permissões.' });
  }
};