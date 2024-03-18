import axios from 'axios';
import { DateTime } from 'luxon';

interface User {
    uid: string;
    data: {
        displayName: string;
        email: string;
        userUid: string;
    };
}

interface WorkRecord {
    [key: string]: string;
}

interface UserWorkStatistics {
    email: string;
    produtividadeMediaDiaria: number;
    produtividadeDiaAnterior: number;
    totalHorasTrabalhadasMes: number;
    totalHorasTrabalhadasHoje: number;
    horasFaltantesHoje: number;
}

export default async function calcularEstatisticasPorUsuario(): Promise<UserWorkStatistics[]> {
    const responseUsers = await axios.get<User[]>("http://localhost:8080/users");
    const responseRecords = await axios.get<WorkRecord[]>("http://localhost:8080/records");

    const usuarios: User[] = responseUsers.data;
    const registros: WorkRecord[] = responseRecords.data;

    const hoje = DateTime.local();
    const ontem = hoje.minus({ days: 1 });

    const estatisticasPorUsuario: UserWorkStatistics[] = [];

    for (const usuario of usuarios) {
        const { email } = usuario.data;

        const registrosUsuario = registros.filter(registro => registro.criado_por === usuario.data.userUid);

        const totalHorasTrabalhadasMes = registrosUsuario.length > 0 ? calcularTotalHorasTrabalhadas(registrosUsuario) : 0;

        const registrosUsuarioHoje = registrosUsuario.filter(registro => {
            const dataRegistro = DateTime.fromISO(registro.data);
            return dataRegistro.hasSame(hoje, 'day') && (registro[`horario_inicio_1`] || registro[`horario_inicio_2`] || registro[`horario_inicio_3`] || registro[`horario_inicio_4`]);
        });

        const totalHorasTrabalhadasHoje = calcularTotalHorasTrabalhadas(registrosUsuarioHoje);
        
        const horasFaltantesHoje = 8 - totalHorasTrabalhadasHoje; 

        const registrosUsuarioOntem = registrosUsuario.filter(registro => {
            const dataRegistro = DateTime.fromISO(registro.data);
            return dataRegistro.hasSame(ontem, 'day') && (registro[`horario_inicio_1`] || registro[`horario_inicio_2`] || registro[`horario_inicio_3`] || registro[`horario_inicio_4`]);
        });

        const totalHorasTrabalhadasOntem = calcularTotalHorasTrabalhadas(registrosUsuarioOntem);

        const totalProdutividadeDiaria = (totalHorasTrabalhadasHoje / 8) * 100;
        const totalProdutividadeDiariaOntem = (totalHorasTrabalhadasOntem / 8) * 100;

        estatisticasPorUsuario.push({
            email,
            produtividadeMediaDiaria: parseFloat(totalProdutividadeDiaria.toFixed(2)),
            produtividadeDiaAnterior: parseFloat(totalProdutividadeDiariaOntem.toFixed(2)),
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
