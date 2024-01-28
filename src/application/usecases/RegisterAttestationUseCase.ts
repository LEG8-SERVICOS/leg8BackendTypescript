import { FirebaseAdapter } from "../../infra/firebase/FirebaseAdapter";
import { AttestationRepository, FirebaseAttestationRepository } from "../repository/AttestationRepository";
import { FirebaseUserRepository, UserRepository } from "../repository/UserRepository";

export interface RegisterAttestationUseCase {
  execute(attestation: any): Promise<void>;
}

export class RegisterAttestationInteractor implements RegisterAttestationUseCase {
  constructor(private firebaseAdapter: FirebaseAdapter) {}

  async execute(attestation: any): Promise<void> {
    const userRepository = new FirebaseUserRepository(this.firebaseAdapter);
    const attestationRepository = new FirebaseAttestationRepository(this.firebaseAdapter);
    const userSnapshot = await userRepository.getUserByUid(attestation.userId);
    if (userSnapshot === null || !userSnapshot.exists()) {
      throw new Error('Usuário não encontrado');
    }
    await attestationRepository.registerAttestation(attestation);
  }
}
