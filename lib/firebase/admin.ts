import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

// Lazy singletons: Firebase Admin is NOT initialized at module-import time.
// Initialization is deferred until the first actual property access,
// which only happens at request time — never during `next build`.
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    if (!_auth) _auth = getAuth(getAdminApp());
    return Reflect.get(_auth, prop, receiver);
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    if (!_db) _db = getFirestore(getAdminApp());
    return Reflect.get(_db, prop, receiver);
  },
});
