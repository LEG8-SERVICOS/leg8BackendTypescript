import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

export interface IFirebase {
  // auth
  signInWithEmailAndPassword(email: string, password: string): Promise<firebase.auth.UserCredential>;
  createUserWithEmailAndPassword(email: string, password: string): Promise<firebase.auth.UserCredential>;
  // database
  setValue(path: string, value: any): Promise<void>;
  getValue(path: string): Promise<any>;
  postValue(path: string, value: any): Promise<string>;
  updateValue(path: string, value: any): Promise<void>;
  deleteValue(path: string): Promise<void>;
  getRef(path: string): firebase.database.Reference; // Adicionando o método getRef
  // getAllUsers
  getAllUsers(): Promise<any[]>;
}

export class FirebaseAdapter implements IFirebase {
  private firebaseApp: firebase.app.App;
  private auth: firebase.auth.Auth;
  private database: firebase.database.Database;

  constructor() {
    this.firebaseApp = firebase.initializeApp({
      apiKey: "AIzaSyB_DXBcxQTJecN1ILVgJegbVe1bZ6ZExys",
      authDomain: "leg8-backend-firebase.firebaseapp.com",
      projectId: "leg8-backend-firebase",
      storageBucket: "leg8-backend-firebase.appspot.com",
      messagingSenderId: "702739405375",
      appId: "1:702739405375:web:42c6f54c6f41bdbf07f68a",
      measurementId: "G-8PQLQFZVTH"
    });

    this.auth = this.firebaseApp.auth();
    this.database = this.firebaseApp.database();
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  async setValue(path: string, value: any): Promise<void> {
    await this.database.ref(path).set(value);
  }

  async getValue(path: string): Promise<any> {
    const snapshot = await this.database.ref(path).once('value');
    return snapshot.val();
  }

  async postValue(path: string, value: any): Promise<string> {
    const newRef = this.database.ref(path).push();
    await newRef.set(value);
    return newRef.key as string;
  }

  async updateValue(path: string, value: any): Promise<void> {
    await this.database.ref(path).update(value);
  }

  async deleteValue(path: string): Promise<void> {
    await this.database.ref(path).remove();
  }

  getRef(path: string): firebase.database.Reference {
    return this.database.ref(path);
  }

  async getAllUsers(): Promise<any[]> {
    const usersSnapshot = await this.database.ref('users').get();
    if (usersSnapshot.exists()) {
      const users: any[] = [];
      usersSnapshot.forEach((userSnapshot) => {
        users.push({
          uid: userSnapshot.key,
          data: userSnapshot.val()
        });
      });
      return users;
    } else {
      return [];
    }
  }
}
