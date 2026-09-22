// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFAWyYCEKutfcn_I_sfddEanNbijqG9nk",
  authDomain: "trackshield-dev.firebaseapp.com",
  projectId: "trackshield-dev",
  storageBucket: "trackshield-dev.firebasestorage.app",
  messagingSenderId: "781259777660",
  appId: "1:781259777660:web:ac65452037befa8b044bf9",
  measurementId: "G-2HY78VKSVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);