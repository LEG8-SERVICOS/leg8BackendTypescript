import { FirebaseAdapter } from "../../infra/firebase/FirebaseAdapter";

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
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      uid: user.uid,
    };
  }
}