import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { createAuditLog } from './audit.service';

const prisma = new PrismaClient();

// ===============================
// 🔐 Validação de segurança
// ===============================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET não definido no .env');
  process.exit(1);
}

// ===============================
// 👤 Registrar usuário
// ===============================
export const registerUser = async (req: Request, res: Response) => {
  const { nome, email, password, roleId } = req.body;

  if (!nome || !email || !password) {
    return res.status(400).json({ message: 'Dados obrigatórios ausentes.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nome,
        email: email.toLowerCase(),
        password: hashedPassword,
        roleId: roleId || 2,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      details: { ip: req.ip },
    });

    res.status(201).json(user);
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }

    res.status(500).json({ message: 'Erro ao registrar utilizador.' });
  }
};

// ===============================
// 🔑 Login
// ===============================
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        entityType: 'Auth',
        entityId: user.id,
        details: { ip: req.ip, reason: 'Senha incorreta' },
      });

      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    // 🔐 2FA
    if (user.isTwoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.status(200).json({
        twoFactorRequired: true,
        tempToken,
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'Auth',
      entityId: user.id,
      details: { ip: req.ip },
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role.name,
        avatarUrl: user.avatarUrl,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// ===============================
// 🔐 Verificar código 2FA
// ===============================
export const verifyTwoFactorToken = async (req: Request, res: Response) => {
  const { token: twoFactorCode, tempToken } = req.body;

  if (!twoFactorCode || !tempToken) {
    return res.status(400).json({ message: 'Dados 2FA obrigatórios.' });
  }

  try {
    const decoded: any = jwt.verify(tempToken, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA não configurado.' });
    }

    const isValid = authenticator.verify({
      token: twoFactorCode,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      await createAuditLog({
        userId: user.id,
        action: '2FA_LOGIN_FAILURE',
        entityType: 'Auth',
        entityId: user.id,
        details: { ip: req.ip },
      });

      return res.status(401).json({ message: 'Código 2FA inválido.' });
    }

    const finalToken = jwt.sign(
      { id: user.id, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS_2FA',
      entityType: 'Auth',
      entityId: user.id,
      details: { ip: req.ip },
    });

    res.status(200).json({
      token: finalToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role.name,
        avatarUrl: user.avatarUrl,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    });
  } catch {
    res.status(401).json({ message: 'Token temporário inválido ou expirado.' });
  }
};

// ===============================
// 👤 Usuário autenticado
// ===============================
export const getAuthUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true,
        isTwoFactorEnabled: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar utilizador.' });
  }
};

// ===============================
// 👥 Listar usuários
// ===============================
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { nome: 'asc' },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar utilizadores.' });
  }
};
