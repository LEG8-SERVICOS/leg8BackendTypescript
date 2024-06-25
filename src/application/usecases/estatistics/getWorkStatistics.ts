import axios, { AxiosResponse } from 'axios';
import { DateTime } from 'luxon';

interface WorkRecord {
    [key: string]: string;
}

interface WorkStatistics {
    produtividadeMediaDiaria: number;
    produtividadeDiaAnterior: number;
    apontamentoFaltanteMes: number;
    totalHorasTrabalhadasMes: number;
}

export default async function calcularEstatisticasDeTrabalho(): Promise<WorkStatistics> {
    const responseUsers: AxiosResponse<any[]> = await axios.get("https://api.leg8.com.br/users");
    const responseRecords: AxiosResponse<WorkRecord[]> = await axios.get("https://api.leg8.com.br/records");

    const usuarios: any[] = responseUsers.data;
    const registros: WorkRecord[] = responseRecords.data;
    const totalUsuarios: number = usuarios.length;

    let totalHorasTrabalhadasMes: number = 0;

    const hoje = DateTime.local();
    const mes = hoje.month;
    const horasPorDia = 8 * totalUsuarios;
    const horasPorMes = 176 * totalUsuarios;

    // Filtrar registros do mês atual
    const registrosMes = registros.filter(registro => {
        const dataRegistro = DateTime.fromISO(registro.data);
        return dataRegistro.month === hoje.month;
    });

    // Calcular total de horas trabalhadas no mês
    registrosMes.forEach(registro => {
        for (let i = 1; i <= totalUsuarios; i++) {
            const horaInicio: string | undefined = registro[`horario_inicio_${i}`];
            const horaFim: string | undefined = registro[`horario_fim_${i}`];

            if (horaInicio && horaFim) {
                const diferencaHoras: number = calcularDiferencaHoras(horaInicio, horaFim);
                totalHorasTrabalhadasMes += diferencaHoras;
            }
        }
    });

    // Filtrar registros do dia atual
    const registrosHoje = registros.filter(registro => {
        const dataRegistro = DateTime.fromISO(registro.data);
        return dataRegistro.hasSame(hoje, 'day');
    });

    // Calcular total de horas trabalhadas hoje
    let totalHorasTrabalhadasHoje: number = 0;
    registrosHoje.forEach(registro => {
        for (let i = 1; i <= totalUsuarios; i++) {
            const horaInicio: string | undefined = registro[`horario_inicio_${i}`];
            const horaFim: string | undefined = registro[`horario_fim_${i}`];

            if (horaInicio && horaFim) {
                const diferencaHoras: number = calcularDiferencaHoras(horaInicio, horaFim);
                totalHorasTrabalhadasHoje += diferencaHoras;
            }
        }
    });

    const totalProdutividadeDiaria = (totalHorasTrabalhadasHoje / horasPorDia) * 100;

    // Filtrar registros do dia anterior
    const ontem = hoje.minus({ days: 1 });
    const registrosOntem = registros.filter(registro => {
        const dataRegistro = DateTime.fromISO(registro.data);
        return dataRegistro.hasSame(ontem, 'day');
    });

    // Calcular total de horas trabalhadas ontem
    let totalHorasTrabalhadasOntem: number = 0;
    registrosOntem.forEach(registro => {
        for (let i = 1; i <= totalUsuarios; i++) {
            const horaInicio: string | undefined = registro[`horario_inicio_${i}`];
            const horaFim: string | undefined = registro[`horario_fim_${i}`];

            if (horaInicio && horaFim) {
                const diferencaHoras: number = calcularDiferencaHoras(horaInicio, horaFim);
                totalHorasTrabalhadasOntem += diferencaHoras;
            }
        }
    });

    const totalProdutividadeDiariaOntem = (totalHorasTrabalhadasOntem / horasPorDia) * 100;

    const totalApontamentoFaltante = (horasPorMes - totalHorasTrabalhadasMes) / mes;

    return {
        produtividadeMediaDiaria: parseFloat(totalProdutividadeDiaria.toFixed(2)),
        produtividadeDiaAnterior: parseFloat(totalProdutividadeDiariaOntem.toFixed(2)),
        apontamentoFaltanteMes: parseFloat(totalApontamentoFaltante.toFixed(2)),
        totalHorasTrabalhadasMes: parseFloat(totalHorasTrabalhadasMes.toFixed(2))
    };
}

function calcularDiferencaHoras(horaInicio: string, horaFim: string): number {
    const inicio = DateTime.fromFormat(horaInicio, 'HH:mm');
    const fim = DateTime.fromFormat(horaFim, 'HH:mm');

    let diferenca = fim.diff(inicio, 'hours').hours;
    if (diferenca < 0) {
        diferenca += 24; // Ajuste para períodos noturnos
    }

    return diferenca;
}
