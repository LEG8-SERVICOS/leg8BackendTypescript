import { FirebaseAdapter } from "../../infra/firebase/FirebaseAdapter";
import { FirebaseUserRepository } from "../repository/UserRepository";

export interface AuthenticatedUser {
  email: string;
  displayName?: string;
  photoURL?: string;
  uid: string;
}

export interface AuthenticateUserUseCase {
  execute(email: string, password: string): Promise<AuthenticatedUser>;
}

export class AuthenticateUserInteractor implements AuthenticateUserUseCase {
  constructor(private firebaseAdapter: FirebaseAdapter) {}

  async execute(email: string, password: string): Promise<AuthenticatedUser> {
    const userCredential = await this.firebaseAdapter.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    // ativar apenas na integracao
    const userData: AuthenticatedUser = {
      uid: userCredential.user?.email ?? '',
      displayName: userCredential.user?.displayName ?? '',
      photoURL: userCredential.user?.photoURL ?? '',
      email: userCredential.user?.email ?? '',
    };
    const userRepository = new FirebaseUserRepository(this.firebaseAdapter);
    await userRepository.createUser(userData);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      uid: user.uid,
    };
  }
}