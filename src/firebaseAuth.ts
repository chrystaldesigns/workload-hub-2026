import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";

export const AUTHORIZED_EMAIL = "imchrystal@gmail.com";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCWVUK8SQCdks_yz3GsZM0wFYL8v2WfK2Q",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "workload-hub-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "workload-hub-2026",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:884468919141:web:89e9d88027be3b520c4f8c",
};

export const firebaseConfigReady = Boolean(firebaseConfig.apiKey && firebaseConfig.appId);

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const observeAuthState = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutOfWorkloadHub = () => signOut(auth);
