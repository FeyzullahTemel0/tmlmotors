const firebaseEnvValues = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

export const requiredFirebaseEnvKeys = Object.keys(firebaseEnvValues) as (keyof typeof firebaseEnvValues)[];

export function getMissingFirebaseEnvKeys(): string[] {
  return requiredFirebaseEnvKeys.filter((key) => {
    const value = firebaseEnvValues[key];
    return !value || value.trim().length === 0;
  });
}

export function isFirebaseEnvReady(): boolean {
  return getMissingFirebaseEnvKeys().length === 0;
}

export function getFirebaseEnvErrorMessage(): string {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length === 0) {
    return "";
  }

  return `Firebase bağlantısı için eksik ortam değişkenleri: ${missing.join(", ")}`;
}
