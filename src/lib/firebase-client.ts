
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA_ExJ7kmlhAUXDXp1CgE6nJA4e2Wo4J58",
  authDomain: "call-quality-compass-xbtu3.firebaseapp.com",
  projectId: "call-quality-compass-xbtu3",
  storageBucket: "call-quality-compass-xbtu3.firebasestorage.app",
  messagingSenderId: "975409597147",
  appId: "1:975409597147:web:6b0ff0da8e12e4001f1afe"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const getFirebaseServices = () => {
  return { auth, db, storage, app };
};

export { db, auth, storage, getFirebaseServices };
