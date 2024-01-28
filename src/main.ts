import express from 'express';
import { FirebaseAdapter } from './infra/firebase/FirebaseAdapter';
import { AuthenticateUserInteractor } from './application/usecases/AuthenticateUserUseCase';
import { HttpController } from './infra/controllers/HttpController';
import { RegisterAttestationInteractor } from './application/usecases/RegisterAttestationUseCase';
import { ListUsersInteractor } from './application/usecases/ListUsersUseCase';
import { FirebaseUserRepository } from './application/repository/UserRepository';
import { CreateRecordUseCase } from './application/usecases/CreateRecordUseCase';

const app = express();
app.use(express.json());

// adapter
const firebaseAdapter = new FirebaseAdapter();
// interactors
const authenticateUserInteractor = new AuthenticateUserInteractor(firebaseAdapter);
const registerAttestationInteractor = new RegisterAttestationInteractor(firebaseAdapter);
const createRecordInterator = new CreateRecordUseCase(firebaseAdapter);
const listUsersInteractor = new ListUsersInteractor(firebaseAdapter);
//repo
const userRepository = new FirebaseUserRepository(firebaseAdapter);
// controller
const httpController = new HttpController(authenticateUserInteractor, registerAttestationInteractor, createRecordInterator, listUsersInteractor, userRepository);

app.post('/login', (req, res) => httpController.login(req, res));
app.post('/attestation', (req, res) => httpController.createAttestation(req, res));
app.get('/users', (req, res) => httpController.listUsers(req, res));
app.post('/record', (req, res) => httpController.createRecord(req, res));


app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
