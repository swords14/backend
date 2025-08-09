import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

// Importar rotas
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

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`--> Pedido Recebido: ${req.method} ${req.url} da origem ${req.headers.origin}`);
  next();
});

// Configuração CORS
const corsOptions = {
  origin: 'https://frontend-erclat.vercel.app', // seu frontend na Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Middleware para responder sempre OPTIONS com status 200
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware para parse JSON e urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para arquivos estáticos (uploads)
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

// Rota teste para verificar CORS e deploy
app.get('/api/test', (req, res) => {
  res.json({ message: 'Deploy de depuração de CORS está a funcionar!', version: 'cors-debug' });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor a rodar na porta ${PORT}`);
});
