import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBc3dFCY932VttzhzaDyHtMbeCRkUQ5GAY",
  authDomain: "pro-bricolage-pn.firebaseapp.com",
  projectId: "pro-bricolage-pn",
  storageBucket: "pro-bricolage-pn.firebasestorage.app",
  messagingSenderId: "716417831858",
  appId: "1:716417831858:web:9ec5d09c9c6fe752e00aab"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
