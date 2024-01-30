import { Request, Response } from 'express';
import { FirebaseAdapter } from '../../../infra/firebase/FirebaseAdapter';
import { FirebaseUserRepository } from '../../repository/UserRepository';

export class HttpController {
  constructor(
    readonly firebaseAdapter: FirebaseAdapter,
    readonly userRepository: FirebaseUserRepository
  ) {}

  async getWorkStatistics(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userRepository.getAllUsers();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const productivityData: Record<string, any> = {};

      for (const user of users) {
        const { uid, data: userData } = user;
        const userRecords = userData.record;
        const individualIndex: Record<string, any> = {};

        let totalHoursWorked = 0;
        let totalProductivity = 0;

        for (const record of userRecords) {
          const recordDate = new Date(record.data);
          const recordMonth = recordDate.getMonth() + 1;
          if (recordMonth === currentMonth) {
            for (let i = 1; i <= 4; i++) {
              const startTime = this.parseTime(record[`horario_inicio_${i}`]);
              const endTime = this.parseTime(record[`horario_fim_${i}`]);
              if (startTime && endTime) {
                const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
                totalHoursWorked += hoursWorked;

                const productivity = (hoursWorked / 8) * 100; // Produtividade baseada em 8 horas diárias
                totalProductivity += productivity;

                individualIndex[`record_${i}`] = {
                  startTime: record[`horario_inicio_${i}`],
                  endTime: record[`horario_fim_${i}`],
                  productivity: productivity.toFixed(2) // Arredonda para duas casas decimais
                };
              }
            }
          }
        }

        const averageProductivity = (totalProductivity / totalHoursWorked) * 8; // Produtividade média por dia baseada em 8 horas

        productivityData[uid] = {
          email: userData.email,
          totalHoursWorked: totalHoursWorked.toFixed(2), // Arredonda para duas casas decimais
          averageProductivity: averageProductivity.toFixed(2), // Arredonda para duas casas decimais
          individualIndex
        };
      }

      res.status(200).json(productivityData);
    } catch (error) {
      console.error('Erro ao obter estatísticas de trabalho:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas de trabalho.' });
    }
  }

  parseTime(timeString: string): number | null {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 * 60 * 1000 + minutes * 60 * 1000;
  }
}
