import axios, { AxiosResponse } from 'axios';
import { DateTime } from 'luxon';

interface User {
    email: string;
}

interface WorkRecord {
    [key: string]: string;
}

interface WorkStatisticsByUser {
    email: string;
    horasDiarias: number;
    horasTrabalhadasDia: number;
    produtividadeDiaria: number;
    produtividadeMensal: number;
    totalHorasTrabalhadasMes: number;
}

export default async function calcularEstatisticasDeTrabalho(): Promise<WorkStatisticsByUser[]> {
    const responseUsers: AxiosResponse<User[]> = await axios.get("http://localhost:8080/users");
    const responseRecords: AxiosResponse<WorkRecord[]> = await axios.get("http://localhost:8080/records");
    
    const users: User[] = responseUsers.data;
    const records: WorkRecord[] = responseRecords.data;

    const statisticsByUser: WorkStatisticsByUser[] = [];

    users.forEach(user => {
        const userEmail = user.email;
        const userRecords = records.filter(record => record.email === userEmail);
        const userStats = calcularEstatisticasPorUsuario(userEmail, userRecords);
        statisticsByUser.push(userStats);
    });

    return statisticsByUser;
}

function calcularEstatisticasPorUsuario(userEmail: string, userRecords: WorkRecord[]): WorkStatisticsByUser {
    const hoje = DateTime.local();
    const mes = hoje.month;
    const horasDiarias = 8;

    let totalHorasTrabalhadasMes = 0;
    let totalHorasTrabalhadasDia = 0;

    // Filtrar registros do mês atual
    const registrosMes = userRecords.filter(registro => {
        const dataRegistro = DateTime.fromISO(registro.data);
        return dataRegistro.month === hoje.month;
    });

    // Calcular total de horas trabalhadas no mês
    registrosMes.forEach(registro => {
        for (let i = 1; i <= 4; i++) {
            const horaInicio: string | undefined = registro[`horario_inicio_${i}`];
            const horaFim: string | undefined = registro[`horario_fim_${i}`];

            if (horaInicio && horaFim) {
                const diferencaHoras: number = calcularDiferencaHoras(horaInicio, horaFim);
                totalHorasTrabalhadasMes += diferencaHoras;
            }
        }
    });

    // Filtrar registros do dia atual
    const registrosHoje = userRecords.filter(registro => {
        const dataRegistro = DateTime.fromISO(registro.data);
        return dataRegistro.hasSame(hoje, 'day');
    });

    // Calcular total de horas trabalhadas hoje
    registrosHoje.forEach(registro => {
        for (let i = 1; i <= 4; i++) {
            const horaInicio: string | undefined = registro[`horario_inicio_${i}`];
            const horaFim: string | undefined = registro[`horario_fim_${i}`];

            if (horaInicio && horaFim) {
                const diferencaHoras: number = calcularDiferencaHoras(horaInicio, horaFim);
                totalHorasTrabalhadasDia += diferencaHoras;
            }
        }
    });

    const produtividadeDiaria = (totalHorasTrabalhadasDia / horasDiarias) * 100;
    const produtividadeMensal = (totalHorasTrabalhadasMes / (mes * horasDiarias)) * 100;

    return {
        email: userEmail,
        horasDiarias,
        horasTrabalhadasDia: totalHorasTrabalhadasDia,
        produtividadeDiaria,
        produtividadeMensal,
        totalHorasTrabalhadasMes
    };
}

function calcularDiferencaHoras(horaInicio: string, horaFim: string): number {
    const inicio = DateTime.fromFormat(horaInicio, 'HH:mm');
    const fim = DateTime.fromFormat(horaFim, 'HH:mm');
    return fim.diff(inicio, 'hours').hours;
}

export async function getStatisticsByUser(email: string): Promise<WorkStatisticsByUser | null> {
    try {
        const responseUsers: AxiosResponse<User[]> = await axios.get("http://localhost:8080/users");
        const responseRecords: AxiosResponse<WorkRecord[]> = await axios.get("http://localhost:8080/records");
        
        const users: User[] = responseUsers.data;
        const records: WorkRecord[] = responseRecords.data;

        const user = users.find(user => user.email === email);
        if (!user) return null;

        const userRecords = records.filter(record => record.email === email);
        return calcularEstatisticasPorUsuario(email, userRecords);
    } catch (error) {
        console.error('Erro ao obter estatísticas por usuário:', error);
        return null;
    }
}
