import { FirebaseAdapter } from "../../infra/firebase/FirebaseAdapter";
import firebase from 'firebase/compat/app';

export interface UserRepository {
  getUserByUid(userUid: string): Promise<firebase.database.DataSnapshot>;
  getAllUsers(): Promise<any[]>;
}

export class FirebaseUserRepository implements UserRepository {
  constructor(private firebaseAdapter: FirebaseAdapter) {}

  async getUserByUid(userUid: string): Promise<firebase.database.DataSnapshot> {
    const usersSnapshot = await this.firebaseAdapter.getRef('users').orderByChild('userUid').equalTo(userUid).once('value');
    return usersSnapshot;
  }

  async getAllUsers(): Promise<any[]> {
    const usersSnapshot = await this.firebaseAdapter.getRef('users').get();
    if (usersSnapshot.exists()) {
      const users: any[] = [];
      usersSnapshot.forEach((userSnapshot) => {
        const userData = userSnapshot.val();
        const userUid = userSnapshot.key;
        const recordSnapshot = userSnapshot.child('record'); 
        const recordData = recordSnapshot.exists() ? recordSnapshot.val() : null; 
        users.push({
          uid: userUid,
          data: {
            ...userData,
            record: recordData 
          }
        });
      });
      return users;
    } else {
      return [];
    }
  }
  

  async createUser(user: any): Promise<string> {
    const path = 'users'; 
    return this.firebaseAdapter.postValue(path, user);
  } 
}
