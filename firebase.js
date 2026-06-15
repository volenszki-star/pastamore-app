// firebase.js — a Firebase kapcsolat.
// Cseréld le az alábbi firebaseConfig-ot a sajátodra (amit a Firebase-konzolban kimásoltál).
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSHiEVy0YGTAacGS6EpJi44mRr6w8frCM",
  authDomain: "dob-18-gastro.firebaseapp.com",
  projectId: "dob-18-gastro",
  storageBucket: "dob-18-gastro.firebasestorage.app",
  messagingSenderId: "1011325612390",
  appId: "1:1011325612390:web:301f8034e0f9b4190618a7",
  measurementId: "G-SWWNVRC7HN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
