import { FirebaseAdapter } from "../../infra/firebase/FirebaseAdapter";
import { FirebaseAttestationRepository } from "../repository/AttestationRepository";


export interface RegisterAttestationUseCase {
  execute(attestation: any): Promise<void>;
  deleteAttestation(attestationId: string): Promise<void>
}

export class RegisterAttestationInteractor implements RegisterAttestationUseCase {
  constructor(private firebaseAdapter: FirebaseAdapter) {}

  async execute(attestation: any): Promise<void> {
    const attestationRepository = new FirebaseAttestationRepository(this.firebaseAdapter);
    await attestationRepository.registerAttestation(attestation);
  }
  async deleteAttestation(attestationId: string): Promise<void> {
    try {
      const path = `attestations/${attestationId}`;
      await this.firebaseAdapter.deleteValue(path);
    } catch (error) {
      throw new Error('Erro ao deletar atestado.');
    }
  }
}
