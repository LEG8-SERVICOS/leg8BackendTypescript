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
}
