// src/application/usecases/ListUsersUseCase.ts
import { FirebaseAdapter } from "../../infra/firebase/FirebaseAdapter";

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface ListUsersUseCase {
  execute(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
}

export class ListUsersInteractor implements ListUsersUseCase {
  private firebaseAdapter: FirebaseAdapter;

  constructor(firebaseAdapter: FirebaseAdapter) {
    this.firebaseAdapter = firebaseAdapter;
  }

  async execute(): Promise<any[]> {
    return this.firebaseAdapter.getAllNonAdminUsers();
  }

  async userExists(userId: string): Promise<boolean> {
    const users = await this.execute();
    return users.some(user => user.uid === userId);
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const path = `users/${userId}`;
      await this.firebaseAdapter.deleteValue(path);
    } catch (error) {
      throw new Error('Erro ao deletar registro.');
    }
  }

}
