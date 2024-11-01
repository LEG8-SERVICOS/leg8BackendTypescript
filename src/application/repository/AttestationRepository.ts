import { FirebaseAdapter } from '../../infra/firebase/FirebaseAdapter';

export interface AttestationRepository {
  registerAttestation(attestation: any): Promise<string>;
  deleteAttestation(attestationId: string): Promise<void>
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
        allAttestation.push({
        uid: attestationSnapshot.key,  
        recordData
        });
      });
    }
    return allAttestation;
  }

  async deleteAttestation(attestationId: string): Promise<void> {
    try {
      const path = `attestations/${attestationId}`;
      await this.firebaseAdapter.deleteValue(path);
    } catch (error) {
      throw new Error('Erro ao deletar atestado.');
    }
  }

  async updateAttestation(attestationId: string, updatedAttestation: any): Promise<void> {
    const path = `attestations/${attestationId}`; 
    await this.firebaseAdapter.updateValue(path, updatedAttestation);
  }
}
