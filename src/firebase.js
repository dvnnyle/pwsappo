// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtB2_FDK2Vje5RWyjqFQkPFtxmC1CDKXA",
  authDomain: "playworldapp-4d326.firebaseapp.com",
  projectId: "playworldapp-4d326",
  storageBucket: "playworldapp-4d326.appspot.com",
  messagingSenderId: "135145634033",
  appId: "1:135145634033:web:2b6ef9b24f09d9ba321150",
  measurementId: "G-BJW0D5DPSW"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services for use in your app
export { app, analytics, auth, db };
