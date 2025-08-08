// Ficheiro: backend/src/controllers/report.controller.ts

import { Request, Response } from 'express';
// A correção está nesta linha, ajustando o nome do arquivo para o singular.
import * as ReportService from '../controllers/report.service'; // <-- CORREÇÃO AQUI

export const getReportData = async (req: Request, res: Response) => {
    const { reportName } = req.params;
    const { startDate, endDate } = req.query;

    // Validação básica das datas
    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ message: 'Período (startDate e endDate) é obrigatório.' });
    }

    try {
        let data;
        // Delega a geração dos dados para o serviço apropriado
        switch (reportName) {
            case 'financeiro':
                data = await ReportService.generateFinanceiroReport(new Date(startDate), new Date(endDate));
                break;
            case 'vendas':
                data = await ReportService.generateVendasReport(new Date(startDate), new Date(endDate));
                break;
            case 'lucratividadeEvento':
                data = await ReportService.generateLucratividadeEventoReport(); // Este relatório é geral, não usa período
                break;
            // Adicione outros cases conforme implementa os serviços
            // case 'operacoes':
            //     data = await ReportService.generateOperacoesReport(new Date(startDate), new Date(endDate));
            //     break;
            default:
                return res.status(404).json({ message: 'Relatório não encontrado.' });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(`Erro ao gerar relatório ${reportName}:`, error);
        res.status(500).json({ message: 'Erro interno ao gerar relatório.', error });
    }
};