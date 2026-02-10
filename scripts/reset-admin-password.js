const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@admin.com";
  const novaSenha = "admin123";

  // 1️⃣ Garantir que o role ADMIN existe
  const roleAdmin = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
    },
  });

  // 2️⃣ Gerar hash da senha
  const hash = await bcrypt.hash(novaSenha, 10);

  // 3️⃣ Criar ou atualizar o usuário admin
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      roleId: roleAdmin.id,
    },
    create: {
      email,
      nome: "Administrador",
      password: hash,
      roleId: roleAdmin.id,
      status: "Ativo",
    },
  });

  console.log("✅ Admin criado/atualizado com sucesso!");
  console.log("📧 Email:", user.email);
  console.log("🔑 Senha:", novaSenha);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar/resetar admin:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
