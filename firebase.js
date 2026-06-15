// firebase.js — a Firebase kapcsolat.
// Cseréld le az alábbi firebaseConfig-ot a sajátodra (amit a Firebase-konzolban kimásoltál).
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "IDE_MASOLD",
  authDomain: "IDE_MASOLD",
  projectId: "IDE_MASOLD",
  storageBucket: "IDE_MASOLD",
  messagingSenderId: "IDE_MASOLD",
  appId: "IDE_MASOLD",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
