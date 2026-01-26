import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";




// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDytO8mafHptbHe0C-iXxbVMn94AoLlFXM",
  authDomain: "dbu-ai.firebaseapp.com",
  projectId: "dbu-ai",
  storageBucket: "dbu-ai.firebasestorage.app",
  messagingSenderId: "402542994766",
  appId: "1:402542994766:web:82f0c5f99ea151602caa1f",
  measurementId: "G-PJK9WN12W4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // We will use this later for history