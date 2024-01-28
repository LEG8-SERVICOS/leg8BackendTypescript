import { FirebaseAdapter } from "../../infra/firebase/FirebaseAdapter";
import firebase from 'firebase/compat/app';

export interface UserRepository {
  getUserByUid(userUid: string): Promise<firebase.database.DataSnapshot>;
}

export class FirebaseUserRepository implements UserRepository {
  constructor(private firebaseAdapter: FirebaseAdapter) {}

  async getUserByUid(userUid: string): Promise<firebase.database.DataSnapshot> {
    const usersSnapshot = await this.firebaseAdapter.getRef('users').orderByChild('userUid').equalTo(userUid).once('value');
    return usersSnapshot;
  }

  async createUser(user: any): Promise<string> {
    const path = 'users'; 
    return this.firebaseAdapter.postValue(path, user);
  } 
} 
