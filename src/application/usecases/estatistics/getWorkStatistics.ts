import axios, { AxiosResponse } from 'axios';
import { DateTime } from 'luxon';

interface WorkRecord {
    [key: string]: string;
}

interface WorkStatistics {
    totalHorasTrabalhadas: { [operador: string]: number };
    produtividadeMediaDiaria: number;
    produtividadeDiaAnterior: number;
    apontamentoFaltanteMes: number;
    totalHorasTrabalhadasMes: number;
}

export default async function calcularEstatisticasDeTrabalho(): Promise<WorkStatistics> {
    const responseUsers: AxiosResponse<any[]> = await axios.get("http://localhost:8080/users");
    const responseRecords: AxiosResponse<WorkRecord[]> = await axios.get("http://localhost:8080/records");
    
    const usuarios: any[] = responseUsers.data;
    const registros: WorkRecord[] = responseRecords.data;
    const totalUsuarios: number = usuarios.length;

    let totalHorasTrabalhadas: { [operador: string]: number } = {};
    let totalHorasTrabalhadasMes: number = 0;
    let totalProdutividadeDiaria: number = 0;
    let totalProdutividadeDiariaOntem: number = 0;
    let totalApontamentoFaltante: number = 0;

    const hoje = DateTime.local();
    const mes = hoje.month;
    const ontem = hoje.minus({ days: 1 });

    registros.forEach(registro => {
        for (let i = 1; i <= totalUsuarios; i++) {
            const horaInicio: string | undefined = registro[`horario_inicio_${i}`];
            const horaFim: string | undefined = registro[`horario_fim_${i}`];

            if (horaInicio && horaFim) {
                const dataRegistro = DateTime.fromISO(registro.data); 

                if (dataRegistro.hasSame(hoje, 'day')) {
                    const diferencaHoras: number = calcularDiferencaHoras(horaInicio, horaFim);
                    totalHorasTrabalhadasMes += diferencaHoras;

                    const operador: string | undefined = registro[`operador_${i}`];

                    if (operador) {
                        if (!totalHorasTrabalhadas[operador]) {
                            totalHorasTrabalhadas[operador] = 0;
                        }
                        totalHorasTrabalhadas[operador] += diferencaHoras;
                    }
                }
            }
        }
    });

    const horasPorDia = 8 * totalUsuarios; 
    const horasPorMes = 176;
    totalProdutividadeDiaria = (totalHorasTrabalhadasMes / horasPorDia) * 100;
    totalApontamentoFaltante = (totalHorasTrabalhadasMes / horasPorMes);

    const registrosOntem = registros.filter(registro => {
        const dataRegistro = DateTime.fromISO(registro.data); 
        return dataRegistro.hasSame(ontem, 'day');
    });

    const totalHorasTrabalhadasOntem = registrosOntem.reduce((total, registro) => {
        let totalHoras = 0;
        for (let i = 1; i <= totalUsuarios; i++) {
            const horaInicio: string | undefined = registro[`horario_inicio_${i}`];
            const horaFim: string | undefined = registro[`horario_fim_${i}`];
            if (horaInicio && horaFim) {
                totalHoras += calcularDiferencaHoras(horaInicio, horaFim);
            }
        }
        return total + totalHoras;
    }, 0);

    totalProdutividadeDiariaOntem = (totalHorasTrabalhadasOntem / horasPorDia) * 100;


    const horasTrabalhadasEsperadasMes = 20 * horasPorDia;
    totalApontamentoFaltante = (horasTrabalhadasEsperadasMes - totalHorasTrabalhadasMes) / mes;

    return {
        totalHorasTrabalhadas,
        produtividadeMediaDiaria: totalProdutividadeDiaria,
        produtividadeDiaAnterior: totalProdutividadeDiariaOntem,
        apontamentoFaltanteMes: totalApontamentoFaltante,
        totalHorasTrabalhadasMes
    };
}

function calcularDiferencaHoras(horaInicio: string, horaFim: string): number {
    const inicio = DateTime.fromFormat(horaInicio, 'HH:mm');
    const fim = DateTime.fromFormat(horaFim, 'HH:mm');
    return fim.diff(inicio, 'hours').hours;
}
