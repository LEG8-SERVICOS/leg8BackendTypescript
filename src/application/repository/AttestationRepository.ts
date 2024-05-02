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

  async getAllAttestation(): Promise<any[]> {
    const attestationSnapshot = await this.firebaseAdapter.getRef('attestations').get();
    const allAttestation: any[] = [];

    if (attestationSnapshot.exists()) {
      attestationSnapshot.forEach((attestationSnapshot) => {
        const recordData = attestationSnapshot.val();
        allAttestation.push(recordData);
      });
    }
    return allAttestation;
  }

  async updateAttestation(attestationId: string, updatedAttestation: any): Promise<void> {
    const path = `attestations/${attestationId}`; 
    await this.firebaseAdapter.updateValue(path, updatedAttestation);
  }
}
