import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDFAWyYCEKutfcn_I_sfddEanNbijqG9nk",
  authDomain: "trackshield-dev.firebaseapp.com",
  projectId: "trackshield-dev",
  storageBucket: "trackshield-dev.appspot.com",
  messagingSenderId: "781259777660",
  appId: "1:781259777660:web:ac65452037befa8b044bf9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);