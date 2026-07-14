import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAvGl9uV6MdkYpR9x1l2FBN3e-7iqFsooU",
  authDomain: "capstone-apartemen.firebaseapp.com",
  projectId: "capstone-apartemen",
  storageBucket: "capstone-apartemen.firebasestorage.app",
  messagingSenderId: "677548683874",
  appId: "1:677548683874:web:4a77108888af7727c9573b",
  measurementId: "G-QVX3559JJL"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);


// Fungsi Sakti Login Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user; // Mengembalikan data user (email, nama, foto)
  } catch (error) {
    console.error("Gagal Login Google:", error);
    return null;
  }
};