// Ficheiro: backend/src/generate-hash.ts
// Versão simplificada para garantir a execução.

import bcrypt from 'bcryptjs';

const generateHash = async () => {
  // A senha está diretamente no código para este teste.
  const password = "admin123"; 

  console.log("Gerando hash para a senha:", password);

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log("\n--- COPIE A LINHA ABAIXO ---");
    console.log("Hash Gerado:", hash);
    console.log("----------------------------\n");

  } catch (error) {
    console.error("Ocorreu um erro ao gerar o hash:", error);
  }
};

generateHash();
