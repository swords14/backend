// Ficheiro: backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- Funções do Perfil do Usuário ---
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
    res.status(500).json({ message: 'Erro interno ao buscar dados do perfil.' });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { nome, email } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { nome, email },
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true,
        role: { select: { name: true } },
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ message: 'Erro interno ao atualizar perfil.' });
  }
};

export const updateUserAvatar = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }
  
  console.log('Recebida requisição para atualizar avatar do usuário:', req.user.id);
  // A lógica de upload com multer seria implementada aqui.

  res.status(200).json({ message: 'Avatar atualizado com sucesso (simulação).', avatarUrl: 'https://via.placeholder.com/150' });
};


// --- FUNÇÕES DE GERENCIAMENTO DE EQUIPE (ATUALIZADAS) ---

/**
 * Lista todos os usuários do sistema.
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true,
        status: true,
        role: { select: { id: true, name: true } }
      },
      orderBy: { nome: 'asc' }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
};

/**
 * Cria um novo usuário diretamente com status "Ativo".
 * Requer permissão de Admin.
 */
export const createUser = async (req: Request, res: Response) => {
    const { nome, email, password, roleId } = req.body;
    try {
        if (!nome || !email || !password || !roleId) {
            return res.status(400).json({ message: 'Nome, email, senha e função são obrigatórios.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                nome,
                email: email.toLowerCase(),
                password: hashedPassword,
                roleId: Number(roleId),
                status: 'Ativo', // Usuário já é criado como ativo
            },
            select: { id: true, nome: true, email: true, status: true, role: { select: { name: true } } }
        });
        
        res.status(201).json(newUser);
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return res.status(400).json({ message: 'Email já está em uso.' });
        }
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
};

/**
 * Atualiza os dados de um usuário específico (nome, email, cargo).
 * Requer permissão de Admin.
 */
export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome, email, roleId, password } = req.body;

    try {
        const dataToUpdate: any = {
            nome,
            email: email ? email.toLowerCase() : undefined,
            roleId: roleId ? Number(roleId) : undefined,
        };

        // Se uma nova senha for fornecida, faz o hash dela
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate,
            select: { id: true, nome: true, email: true, status: true, role: { select: { name: true } } }
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
};


/**
 * Remove um usuário do sistema.
 */
export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        if (req.user && req.user.id === Number(id)) {
            return res.status(400).json({ message: 'Você não pode remover a si mesmo.' });
        }
        await prisma.user.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (error) {
        console.error("Erro ao remover usuário:", error);
        res.status(500).json({ message: 'Erro ao remover usuário.' });
    }
};
