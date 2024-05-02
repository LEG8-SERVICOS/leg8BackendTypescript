import { FirebaseAdapter } from '../../infra/firebase/FirebaseAdapter';

interface RecordData {
  titulo: string;
  local: string;
  data: string;
  data_fabricacao: string;
  fornecedor: string;
  peca: string;
  lote: string;
  codigo: string;
  defeito: string;
  quantidade_total: number;
  aprovados: number;
  rejeitados: number;
  retrabalhados: number;
  criado_por: string; 
  operador_1: string; 
  operador_2: string | null; 
  operador_3: string | null; 
  operador_4: string | null; 
  horario_inicio_1: string;
  horario_inicio_2: string | null;
  horario_inicio_3: string | null;
  horario_inicio_4: string | null;
  horario_fim_1: string;
  horario_fim_2: string | null;
  horario_fim_3: string | null;
  horario_fim_4: string | null;
  nomeop1: string;
  nomeop2: string | null;
  nomeop3: string | null;
  nomeop4: string | null;
  observacoes: string | null;
}

export class CreateRecordUseCase {
  constructor(private firebaseAdapter: FirebaseAdapter) {}

  async execute(recordData: RecordData): Promise<void> {
    try {
      const path = 'records';
      await this.firebaseAdapter.postValue(path, recordData);
    } catch (error) {
      throw new Error('Erro ao criar registro.');
    }
  }
  async getAllRecords(): Promise<any[]> {
    const recordsSnapshot = await this.firebaseAdapter.getRef('records').get();
    const allRecords: any[] = [];

    if (recordsSnapshot.exists()) {
      recordsSnapshot.forEach((recordSnapshot) => {
        const recordData = recordSnapshot.val();
        allRecords.push(recordData);
      });
    }
    return allRecords;
  }

  async updateRecord(userId: string, updatedRecord: any): Promise<void> {
    const path = `records/${userId}`; 
    await this.firebaseAdapter.updateValue(path, updatedRecord);
  }
}
