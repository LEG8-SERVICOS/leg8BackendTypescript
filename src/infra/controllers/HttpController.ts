import { Request, Response } from 'express';
import { AuthenticateUserUseCase, AuthenticatedUser } from '../../application/usecases/AuthenticateUserUseCase';
import { RegisterAttestationUseCase } from '../../application/usecases/RegisterAttestationUseCase';
import { ListUsersUseCase } from '../../application/usecases/ListUsersUseCase';
import { FirebaseUserRepository } from '../../application/repository/UserRepository';
import { CreateRecordUseCase } from '../../application/usecases/CreateRecordUseCase';

export class HttpController {
   constructor(
    readonly authenticateUserUseCase: AuthenticateUserUseCase,
    readonly registerAttestationUseCase: RegisterAttestationUseCase,
    readonly createRecordUseCase: CreateRecordUseCase,
    readonly listUsersUseCase: ListUsersUseCase,
    readonly userRepository: FirebaseUserRepository
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user: AuthenticatedUser = await this.authenticateUserUseCase.execute(email, password);
      res.status(200).json(user);
      await this.createOrUpdateUser({userUid: user.uid, email, displayName: user.displayName, photoURL: user.photoURL}); 
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(400).json({ message: 'Erro ao fazer login' });
    }
  }

  async createOrUpdateUser(userData: any): Promise<void> {
    try {
      await this.userRepository.createUser(userData);
      console.log('Usuário criado ou atualizado com sucesso:', userData);
    } catch (error) {
      console.error('Erro ao criar ou atualizar usuário:', error);
    }
  }

  async createAttestation(req: Request, res: Response): Promise<void> {
    const { userId, hoursStopped, date, observations } = req.body;

    try {
      await this.registerAttestationUseCase.execute({ userId, hoursStopped, date, observations });
      res.status(201).json({ message: 'Atestado criado com sucesso' });
    } catch (error) {
      console.error('Erro ao criar atestado:', error);
      res.status(500).json({ error: 'Erro ao criar atestado' });
    }
  }

  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.listUsersUseCase.execute();
      res.status(200).json(users);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ message: 'Erro ao listar usuários' });
    }
  }
  async createRecord(req: Request, res: Response): Promise<void> {
    try {
      const recordData = req.body;
      await this.createRecordUseCase.execute(recordData);
      res.status(201).json({ message: 'Registro criado com sucesso.' });
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      res.status(500).json({ error: 'Erro ao criar registro.' });
    }
  }

  async getWorkStatistics(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userRepository.getAllUsers();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const productivityData: Record<string, any> = {};
  
      for (const user of users) {
        const { uid, data: userData } = user;
        const userRecords = userData.record;
  
        // Verifica se userRecords é null e define como um array vazio se for
        const recordsArray = Array.isArray(userRecords) ? userRecords : [];
  
        const individualIndex: Record<string, any> = {};
  
        let totalHoursWorked = 0;
        let totalProductivity = 0;
  
        for (const record of recordsArray) {
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
  
        // Calcula a produtividade média apenas se houver horas trabalhadas no mês
        const averageProductivity = totalHoursWorked !== 0 ? (totalProductivity / totalHoursWorked) * 8 : 0;
  
        productivityData[uid] = {
          email: userData.email,
          totalHoursWorked: totalHoursWorked.toFixed(2), // Arredonda para duas casas decimais
          averageProductivity: isNaN(averageProductivity) ? 0 : averageProductivity.toFixed(2), // Verifica se a média é NaN e define como 0
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
