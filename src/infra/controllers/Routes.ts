import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import { HttpController } from './HttpController';
import { FirebaseAdapter } from '../firebase/FirebaseAdapter';
import { AuthenticateUserInteractor } from '../../application/usecases/AuthenticateUserUseCase';
import { RegisterAttestationInteractor } from '../../application/usecases/RegisterAttestationUseCase';
import { ListUsersInteractor } from '../../application/usecases/ListUsersUseCase';
import { CreateRecordUseCase } from '../../application/usecases/CreateRecordUseCase';
import { FirebaseUserRepository } from '../../application/repository/UserRepository';

const router = express.Router();

export default function setupRoutes() {
  const firebaseAdapter = new FirebaseAdapter();
  const authenticateUserInteractor = new AuthenticateUserInteractor(firebaseAdapter);
  const registerAttestationInteractor = new RegisterAttestationInteractor(firebaseAdapter);
  const createRecordInterator = new CreateRecordUseCase(firebaseAdapter);
  const listUsersInteractor = new ListUsersInteractor(firebaseAdapter);
  const userRepository = new FirebaseUserRepository(firebaseAdapter);
  const httpController = new HttpController(
    authenticateUserInteractor, 
    registerAttestationInteractor,
    createRecordInterator,
    listUsersInteractor,
    userRepository
  );

  router.post('/login', (req, res) => httpController.login(req, res));
  router.post('/attestation', (req, res) => httpController.createAttestation(req, res));
  router.get('/users', (req, res) => httpController.listUsers(req, res));
  router.post('/record', (req, res) => httpController.createRecord(req, res));
  router.get('/work-statistics', (req, res) => httpController.getWorkStatistics(req, res));
  
  //inicial view
  router.get('/', async (req, res) => {
    const filePath = path.join(__dirname, '../../View', 'index.html');
    const htmlTemplate = await fs.readFile(filePath, 'utf8');
    const message: string = 'PROD' ?? 'PROD';

    const renderedHtml = htmlTemplate.replace('{{message}}', message).replace('{{message}}', message);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderedHtml);
  })
  return router
}
