import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFAWyYCEKutfcn_I_sfddEanNbijqG9nk",
  authDomain: "trackshield-dev.firebaseapp.com",
  projectId: "trackshield-dev",
  storageBucket: "trackshield-dev.firebasestorage.app",
  messagingSenderId: "781259777608",
  appId: "1:781259777608:web:ac65452037befa8b044bf9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);