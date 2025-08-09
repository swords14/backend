import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Lista todos os cargos (funções)
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cargos.' });
  }
};

// Cria um novo cargo (função)
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body; // permissions é um array de IDs
    const newRole = await prisma.role.create({
      data: {
        name,
        permissions: {
          connect: permissions.map((id: number) => ({ id })),
        },
      },
      include: { permissions: true },
    });
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar cargo.' });
  }
};

// Atualiza um cargo (função) existente
export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;
        const updatedRole = await prisma.role.update({
            where: { id: Number(id) },
            data: {
                name,
                permissions: {
                    set: permissions.map((id: number) => ({ id })), // 'set' remove as antigas e conecta as novas
                },
            },
            include: { permissions: true },
        });
        res.status(200).json(updatedRole);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar cargo.' });
    }
};