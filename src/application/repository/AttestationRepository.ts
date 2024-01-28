import { FirebaseAdapter } from '../../infra/firebase/FirebaseAdapter';

export interface AttestationRepository {
  registerAttestation(attestation: any): Promise<string>;
}

export class FirebaseAttestationRepository implements AttestationRepository {
  constructor(private firebaseAdapter: FirebaseAdapter) {}

  async registerAttestation(attestation: any): Promise<string> {
    const path = 'attestations'; 
    return this.firebaseAdapter.postValue(path, attestation);
  }
}
