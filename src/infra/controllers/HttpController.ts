import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { AuthenticateUserUseCase, AuthenticatedUser } from '../../application/usecases/AuthenticateUserUseCase';
import { RegisterAttestationUseCase } from '../../application/usecases/RegisterAttestationUseCase';
import { ListUsersUseCase } from '../../application/usecases/ListUsersUseCase';
import { FirebaseUserRepository } from '../../application/repository/UserRepository';
import { CreateRecordUseCase } from '../../application/usecases/CreateRecordUseCase';
import { FirebaseAttestationRepository } from '../../application/repository/AttestationRepository';

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
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(400).json({ message: 'Erro ao fazer login' });
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
  

  parseTime(timeString: string): number | null {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 * 60 * 1000 + minutes * 60 * 1000;
  }
}
