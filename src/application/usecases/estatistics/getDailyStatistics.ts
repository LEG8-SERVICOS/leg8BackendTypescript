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

interface AttestationRecord {
    data: string;
    ficou_parado: string;
    observacoes: string;
    user: string;
}

interface WorkStatistics {
    nome_usuario: string;
    data: string;
    dia_da_semana: string; // Agora obrigatório
    horas_mensais: number;
    horas_trabalhadas: number;
    horas_atestados: number;
    apontamento_faltante: number;
    produtividade_diaria: number;
}

export default async function calcularEstatisticasPorUsuarioDaily(): Promise<WorkStatistics[]> {
    const responseUsers = await axios.get<User[]>("https://api.leg8.com.br/users");
    const responseRecords = await axios.get<WorkRecord[]>("https://api.leg8.com.br/records");
    const responseAttestations = await axios.get<AttestationRecord[]>("https://api.leg8.com.br/attestations");

    const usuarios: User[] = responseUsers.data;
    const registros: WorkRecord[] = responseRecords.data;
    const atestados: AttestationRecord[] = responseAttestations.data;

    const hoje = DateTime.local();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    const estatisticasPorUsuario: WorkStatistics[] = [];

    for (const usuario of usuarios) {
        const { email } = usuario.data;

        // Filtrando registros do usuário
        const registrosUsuario = registros.filter(registro => registro.userUid === usuario.data.userUid);

        // Estrutura para armazenar registros por data
        const registrosPorData: { [data: string]: WorkRecord[] } = {};
        registrosUsuario.forEach(registro => {
            const dataRegistro = DateTime.fromISO(registro.data).toFormat('yyyy-MM-dd');
            if (!registrosPorData[dataRegistro]) {
                registrosPorData[dataRegistro] = [];
            }
            registrosPorData[dataRegistro].push(registro);
        });

        for (const data in registrosPorData) {
            const registrosDoDia = registrosPorData[data];
            const dataFormatada = DateTime.fromISO(data);
            const diaDaSemana = dataFormatada.weekday; // Obtendo o dia da semana

            const totalHorasTrabalhadas = calcularTotalHorasTrabalhadas(registrosDoDia);
            const totalHorasAtestadas = calcularTotalHorasAtestadas(atestados, usuario.data.userUid, data);
            const horasFaltantes = 176 - totalHorasTrabalhadas;

            const produtividadeDiaria = (totalHorasTrabalhadas / 8) * 100;

            const estatisticaDia: WorkStatistics = {
                nome_usuario: email,
                data: dataFormatada.toFormat('dd/MM/yyyy'),
                dia_da_semana: diasSemana[diaDaSemana - 1], // Ajustando para base 0
                horas_mensais: 176,
                horas_trabalhadas: totalHorasTrabalhadas,
                horas_atestados: totalHorasAtestadas,
                apontamento_faltante: horasFaltantes,
                produtividade_diaria: produtividadeDiaria
            };

            estatisticasPorUsuario.push(estatisticaDia);
        }
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

function calcularTotalHorasAtestadas(atestados: AttestationRecord[], userId: string, data: string): number {
    const atestadosUsuarioData = atestados.filter(atestado => atestado.user === userId && atestado.data === data);
    return atestadosUsuarioData.reduce((total, atestado) => {
        const horaAtestado = atestado.ficou_parado;
        const [horas, minutos] = horaAtestado.split(':').map(Number);
        total += horas + minutos / 60;
        return total;
    }, 0);
}

function calcularDiferencaHoras(horaInicio: string, horaFim: string): number {
    const inicio = DateTime.fromFormat(horaInicio, 'HH:mm');
    const fim = DateTime.fromFormat(horaFim, 'HH:mm');
    return fim.diff(inicio, 'hours').hours;
}
