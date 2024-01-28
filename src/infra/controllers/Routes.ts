// routes.ts
import express from 'express';
import { HttpController } from './HttpController';

const router = express.Router();

export default function setupRoutes(httpController: HttpController) {
  router.post('/login', (req, res) => httpController.login(req, res));
  router.post('/attestation', (req, res) => httpController.createAttestation(req, res));
  router.get('/users', (req, res) => httpController.listUsers(req, res));
  router.post('/record', (req, res) => httpController.createRecord(req, res));

  return router;
}
