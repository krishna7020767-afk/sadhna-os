// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";   // Firestore
import { getAuth } from "firebase/auth";             // Authentication

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOtiCkeyxFpB0wJU1FuYDg1-FUJofykQI",
  authDomain: "sadhana-os-1896.firebaseapp.com",
  projectId: "sadhana-os-1896",
  storageBucket: "sadhana-os-1896.firebasestorage.app",
  messagingSenderId: "601313281907",
  appId: "1:601313281907:web:ea2b713393bf6f0d11a706",
  measurementId: "G-1GV2KGT38D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Authentication
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
