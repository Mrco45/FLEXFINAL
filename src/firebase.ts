// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDfsSzjcR8qix6aiCF9slSgeO5II6Wja0c",
  authDomain: "flex-33.firebaseapp.com",
  projectId: "flex-33",
  storageBucket: "flex-33.appspot.com",
  messagingSenderId: "549763197647",
  appId: "1:549763197647:web:64d8dae5037d81af5665ba",
  measurementId: "G-EXS6EDL4FM"
};

const app = initializeApp(firebaseConfig);
export { app };
export const db = getFirestore(app);
export const storage = getStorage(app);
