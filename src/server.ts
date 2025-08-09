// Caminho: backend/src/server.ts

import 'dotenv/config';

import express from 'express';
import cors, { CorsOptions } from 'cors';
import path from 'path';

// Importação de todas as suas rotas
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import eventRoutes from './routes/event.routes';
import dashboardRoutes from './routes/dashboard.routes';
import transactionRoutes from './routes/transaction.routes';
import supplierRoutes from './routes/supplier.routes';
import inventoryRoutes from './routes/inventory.route';
import calendarRoutes from './routes/calendar.routes';
import reportRoutes from './routes/report.routes';
import auditRoutes from './routes/audit.routes';
import companyRoutes from './routes/company.routes';
import userRoutes from './routes/user.routes';
import permissionRoutes from './routes/permission.routes';
import roleRoutes from './routes/role.routes';
import documentTemplateRoutes from './routes/documentTemplate.routes';
import budgetRoutes from './routes/budget.routes';
import serviceRoutes from './routes/service.routes';
import segurancaRoutes from './routes/seguranca.routes';
import { layoutRoutes } from './routes/layout.routes';
import taskRoutes from './routes/task.routes';
import contractRoutes from './routes/contract.routes';
import feedbackRoutes from './routes/feedback.routes';
import funnelRoutes from './routes/funnel.routes';

const app = express();
const PORT = process.env.PORT || 3333;

// --- Middlewares ---

// --- CONFIGURAÇÃO DE CORS CORRIGIDA E ROBUSTA ---
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Padrões de URL permitidos usando Expressões Regulares (RegExp)
    const allowedOriginPatterns = [
      /^https:\/\/frontend-erclat\.vercel\.app$/, // Domínio principal de produção
      /^https:\/\/frontend-erclat-.*\.vercel\.app$/ // Padrão para todos os previews da Vercel
    ];

    // Adiciona http://localhost:<qualquer-porta> para desenvolvimento local
    if (process.env.NODE_ENV !== 'production') {
        allowedOriginPatterns.push(/^http:\/\/localhost:\d+$/);
    }

    // Permite requisições se a origem corresponder a um dos padrões
    // ou se não houver origem (ex: Postman, apps mobile)
    if (!origin || allowedOriginPatterns.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      // Rejeita a requisição se a origem não for permitida
      callback(new Error('Acesso negado pela política de CORS'));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Garante que todos os métodos HTTP são permitidos
  credentials: true, // Permite o envio de cookies, se necessário
  optionsSuccessStatus: 200 // Para navegadores legados
};

app.use(cors(corsOptions));
// --- FIM DA CONFIGURAÇÃO DE CORS ---

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/templates', documentTemplateRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/seguranca', segurancaRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/funnel', funnelRoutes);
app.use('/api', layoutRoutes); 

// ROTA DE TESTE PARA VERIFICAR A VERSÃO DO DEPLOY
app.get('/api/test', (req, res) => {
  res.json({ message: 'Deploy de CORS atualizado (v3 - RegExp) está funcionando!', version: '3.0' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor a rodar na porta ${PORT}`);
});
