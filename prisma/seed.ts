// Ficheiro: backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('A iniciar o processo de seeding...');

  // --- 1. CRIAR PERMISSÕES ---
  const permissionsData = [
    { action: 'Ver Dashboard', subject: 'Geral' },
    { action: 'Gerenciar Eventos', subject: 'Eventos' },
    { action: 'Ver Eventos', subject: 'Eventos' },
    { action: 'Gerenciar Clientes', subject: 'Clientes' },
    { action: 'Ver Financeiro', subject: 'Financeiro' },
    { action: 'Gerenciar Financeiro', subject: 'Financeiro' },
    { action: 'Gerenciar Equipe', subject: 'Configurações' },
    { action: 'Gerenciar Funções e Permissões', subject: 'Configurações' },
  ];

  console.log('A criar ou verificar permissões...');
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { action_subject: { action: p.action, subject: p.subject } },
      update: {},
      create: p,
    });
  }
  console.log('Permissões sincronizadas.');

  // --- 2. CRIAR CARGOS (ROLES) E ATRIBUIR PERMISSÕES ---
  console.log('A criar ou verificar cargos...');
  const allPermissions = await prisma.permission.findMany();

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
        permissions: {
            set: allPermissions.map(p => ({ id: p.id })),
        }
    },
    create: {
      name: 'Admin',
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id })),
      },
    },
  });
  console.log('Cargo "Admin" sincronizado com todas as permissões.');

  await prisma.role.upsert({
    where: { name: 'Membro' },
    update: {},
    create: {
      name: 'Membro',
      permissions: {
        connect: [
          { action_subject: { action: 'Ver Dashboard', subject: 'Geral' } },
          { action_subject: { action: 'Ver Eventos', subject: 'Eventos' } },
        ],
      },
    },
  });
  console.log('Cargo "Membro" sincronizado.');

  // --- 3. CRIAR UTILIZADOR ADMIN INICIAL ---
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@buffet.com' },
  });

  if (existingAdmin) {
    console.log(`Utilizador Admin '${existingAdmin.email}' já existe.`);
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        nome: 'Administrador',
        email: 'admin@buffet.com',
        password: hashedPassword,
        roleId: adminRole.id,
        status: 'Ativo',
      },
    });
    console.log(`Utilizador Admin 'admin@buffet.com' criado com sucesso.`);
  }

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
