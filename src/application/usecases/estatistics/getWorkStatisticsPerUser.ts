import axios from 'axios';
import { DateTime } from 'luxon';

interface User {
    uid: string;
    displayName: string;
    email: string;
}

interface WorkRecord {
    [key: string]: string;
}

interface UserWorkStatistics {
    displayName: string;
    produtividadeMediaDiaria: number;
    produtividadeDiaAnterior: number;
    totalHorasTrabalhadasMes: number;
    totalHorasTrabalhadasHoje: number;
    horasFaltantesHoje: number;
}

export default async function calcularEstatisticasPorUsuario(): Promise<UserWorkStatistics[]> {
    const responseUsers = await axios.get("http://localhost:8080/users");
    const responseRecords = await axios.get("http://localhost:8080/records");

    const usuarios = responseUsers.data;

    const registros: WorkRecord[] = responseRecords.data;

    const hoje = DateTime.local();

    const estatisticasPorUsuario: UserWorkStatistics[] = [];

    for (const usuario of usuarios) {
        const { uid, data } = usuario;
        const displayName = data.displayName; // Ajuste para acessar o displayName

        let totalHorasTrabalhadasMes = 0;
        let totalHorasTrabalhadasHoje = 0;

        for (const registro of registros) {
            for (let i = 1; i <= 4; i++) {
                const operadorUid = registro[`operador_${i}`];
                if (operadorUid === uid) {
                    const horaInicio = registro[`horario_inicio_${i}`];
                    const horaFim = registro[`horario_fim_${i}`];
                    if (horaInicio && horaFim) {
                        const horasTrabalhadas = calcularDiferencaHoras(horaInicio, horaFim);
                        if (DateTime.fromISO(registro.data).hasSame(hoje, 'day')) {
                            totalHorasTrabalhadasHoje += horasTrabalhadas;
                        }
                        totalHorasTrabalhadasMes += horasTrabalhadas;
                    }
                }
            }
        }

        const horasFaltantesHoje = 8 - totalHorasTrabalhadasHoje;
        const produtividadeMediaDiaria = totalHorasTrabalhadasHoje / 8 * 100;
        const produtividadeDiaAnterior = totalHorasTrabalhadasMes / 8 * 100;

        estatisticasPorUsuario.push({
            displayName,
            produtividadeMediaDiaria: parseFloat(produtividadeMediaDiaria.toFixed(2)),
            produtividadeDiaAnterior: parseFloat(produtividadeDiaAnterior.toFixed(2)),
            totalHorasTrabalhadasMes,
            totalHorasTrabalhadasHoje,
            horasFaltantesHoje
        });
    }

    return estatisticasPorUsuario;
}



function calcularTotalHorasTrabalhadas(registros: WorkRecord[]): number {
    return registros.reduce((total, registro) => {
        for (let i = 1; i <= 4; i++) {
            const horaInicio = registro[`horario_inicio_${i}`];
            const horaFim = registro[`horario_fim_${i}`];
            if (horaInicio && horaFim) {
                total += calcularDiferencaHoras(horaInicio, horaFim);
            }
        }
        return total;
    }, 0);
}

function calcularDiferencaHoras(horaInicio: string, horaFim: string): number {
    const inicio = DateTime.fromFormat(horaInicio, 'HH:mm');
    const fim = DateTime.fromFormat(horaFim, 'HH:mm');
    return fim.diff(inicio, 'hours').hours;
}
