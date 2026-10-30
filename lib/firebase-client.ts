import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import { getFirebaseEnvErrorMessage, isFirebaseEnvReady } from "@/lib/env";

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function ensureFirebaseInitialized() {
  if (!isFirebaseEnvReady()) {
    throw new Error(getFirebaseEnvErrorMessage());
  }

  if (!appInstance) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    appInstance = getApps().length > 0 ? getApps()[0] : initializeApp(config);
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
  }
}

export function getFirebaseAuth(): Auth {
  ensureFirebaseInitialized();
  if (!authInstance) {
    throw new Error("Firebase Auth başlatılamadı.");
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  ensureFirebaseInitialized();
  if (!firestoreInstance) {
    throw new Error("Firestore başlatılamadı.");
  }
  return firestoreInstance;
}

export function getFirebaseStorageClient(): FirebaseStorage {
  ensureFirebaseInitialized();
  if (!storageInstance) {
    throw new Error("Firebase Storage başlatılamadı.");
  }
  return storageInstance;
}

export async function uploadProfileImageToFirebase(uid: string, file: File): Promise<string> {
  if (!uid) {
    throw new Error("Profil fotoğrafı yüklemek için kullanıcı kimliği gereklidir.");
  }

  const storage = getFirebaseStorageClient();
  const objectRef = ref(storage, `users/${uid}/profile/${Date.now()}-${file.name}`);
  await uploadBytes(objectRef, file);
  return getDownloadURL(objectRef);
}

export function getFirebaseConnectionStatus() {
  return {
    ready: isFirebaseEnvReady(),
    message: getFirebaseEnvErrorMessage(),
  };
}
