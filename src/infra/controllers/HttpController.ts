import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { AuthenticateUserUseCase, AuthenticatedUser } from '../../application/usecases/AuthenticateUserUseCase';
import { RegisterAttestationUseCase } from '../../application/usecases/RegisterAttestationUseCase';
import { ListUsersUseCase } from '../../application/usecases/ListUsersUseCase';
import { FirebaseUserRepository } from '../../application/repository/UserRepository';
import { CreateRecordUseCase } from '../../application/usecases/CreateRecordUseCase';
import { FirebaseAttestationRepository } from '../../application/repository/AttestationRepository';
import WorkStatistics from '../../application/usecases/estatistics/getWorkStatistics';

export class HttpController {
   constructor(
    readonly authenticateUserUseCase: AuthenticateUserUseCase,
    readonly registerAttestationUseCase: RegisterAttestationUseCase,
    readonly createRecordUseCase: CreateRecordUseCase,
    readonly listUsersUseCase: ListUsersUseCase,
    readonly userRepository: FirebaseUserRepository,
    readonly attestationRepository: FirebaseAttestationRepository,
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

  async getAttestations(req: Request, res: Response): Promise<void> {
    try {
      const attestation = await this.attestationRepository.getAllAttestation()
      res.status(200).json(attestation);
    } catch (error) {
      console.error('Erro ao listar atestados:', error);
      res.status(500).json({ message: 'Erro ao listar atestados' });
    }
  }

  async createAttestation(req: Request, res: Response): Promise<void> {
    const { userId, hoursStopped, date, observations } = req.body;

    try {
      await this.registerAttestationUseCase.execute(req.body);
      res.status(201).json({ message: 'Atestado criado com sucesso' });
    } catch (error) {
      console.error('Erro ao criar atestado:', error);
      res.status(500).json({ error: 'Erro ao criar atestado' });
    }
  }

  async getRecords(req: Request, res: Response): Promise<void> {
    try {
      const records = await this.createRecordUseCase.getAllRecords();
      res.status(200).json(records);
    } catch (error) {
      console.error('Erro ao listar registros:', error);
      res.status(500).json({ message: 'Erro ao listar registros' });
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
      const allRecords = await this.createRecordUseCase.getAllRecords();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const productivityData: Record<string, any> = {};
  
      for (const record of allRecords) {
        const recordDate = new Date(record.data);
        const recordMonth = recordDate.getMonth() + 1;
        console.log(recordMonth, currentMonth, recordDate, currentDate, record)
        if (recordMonth === currentMonth) {
          const userId = record.operador_1;
          const startTime = this.parseTime(record.horario_inicio_1); 
          const endTime = this.parseTime(record.horario_fim_1); 
          
          if (startTime && endTime) {
            const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
            const productivity = (record.aprovados / record.quantidade_total) * 100; 
            if (!productivityData[userId]) {
              productivityData[userId] = {
                email: record.operador_1, 
                totalHoursWorked: 0,
                totalProductivity: 0,
                individualIndex: {}
              };
            }
  
            productivityData[userId].totalHoursWorked += hoursWorked;
            productivityData[userId].totalProductivity += productivity;
  
            const indexKey = uuidv4(); 
            productivityData[userId].individualIndex[indexKey] = {
              startTime: record.horario_inicio_1,
              endTime: record.horario_fim_1,
              productivity: productivity.toFixed(2) 
            };
          }
        }
      }
  
      for (const userId in productivityData) {
        const { totalHoursWorked, totalProductivity, individualIndex } = productivityData[userId];
        const averageProductivity = totalHoursWorked !== 0 ? (totalProductivity / totalHoursWorked) : 0;
        
        productivityData[userId].totalHoursWorked = totalHoursWorked.toFixed(2);
        productivityData[userId].averageProductivity = isNaN(averageProductivity) ? 0 : averageProductivity.toFixed(2);
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
