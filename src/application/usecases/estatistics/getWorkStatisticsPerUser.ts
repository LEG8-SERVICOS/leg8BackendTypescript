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
    const responseUsers = await axios.get("https://leg8backendtypescript-t3md.onrender.com/users");
    const responseRecords = await axios.get("https://leg8backendtypescript-t3md.onrender.com/records");

    const usuarios = responseUsers.data;
    const registros: WorkRecord[] = responseRecords.data;
    const hoje = DateTime.local();
    const ontem = hoje.minus({ days: 1 });

    const estatisticasPorUsuario: UserWorkStatistics[] = [];

    for (const usuario of usuarios) {
        const { uid, data } = usuario;
        const displayName = data.displayName;

        let totalHorasTrabalhadasMes = 0;
        let totalHorasTrabalhadasHoje = 0;
        let totalHorasTrabalhadasOntem = 0;

        for (const registro of registros) {
            for (let i = 1; i <= 4; i++) {
                const operadorUid = registro[`operador_${i}`];
                if (operadorUid === uid) {
                    const horaInicio = registro[`horario_inicio_${i}`];
                    const horaFim = registro[`horario_fim_${i}`];
                    if (horaInicio && horaFim) {
                        const horasTrabalhadas = calcularDiferencaHoras(horaInicio, horaFim);
                        const dataRegistro = DateTime.fromISO(registro.data);
                        if (dataRegistro.hasSame(hoje, 'day')) {
                            totalHorasTrabalhadasHoje += horasTrabalhadas;
                        } else if (dataRegistro.hasSame(ontem, 'day')) {
                            totalHorasTrabalhadasOntem += horasTrabalhadas;
                        }
                        if (dataRegistro.month === hoje.month && dataRegistro.year === hoje.year) {
                            totalHorasTrabalhadasMes += horasTrabalhadas;
                        }
                    }
                }
            }
        }

        const horasFaltantesHoje = 8 - totalHorasTrabalhadasHoje;
        const produtividadeMediaDiaria = (totalHorasTrabalhadasHoje / 8) * 100;
        const produtividadeDiaAnterior = (totalHorasTrabalhadasOntem / 8) * 100;

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

function calcularDiferencaHoras(horaInicio: string, horaFim: string): number {
    const inicio = DateTime.fromFormat(horaInicio, 'HH:mm');
    const fim = DateTime.fromFormat(horaFim, 'HH:mm');

    let diferenca = fim.diff(inicio, 'hours').hours;
    if (diferenca < 0) {
        diferenca += 24; // Ajuste para períodos noturnos
    }

    return diferenca;
}
