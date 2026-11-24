import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebase-config.js';

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
