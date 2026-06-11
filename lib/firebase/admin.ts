import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Strip accidental surrounding quotes (e.g. user copied "-----BEGIN..." with quotes)
  let key = raw.trim().replace(/^["']|["']$/g, "");
  // Replace literal \n sequences with real newlines (Vercel UI stores them as two chars)
  key = key.replace(/\\n/g, "\n");
  return key;
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin env vars missing: ${[
        !projectId && "FIREBASE_PROJECT_ID",
        !clientEmail && "FIREBASE_CLIENT_EMAIL",
        !privateKey && "FIREBASE_PRIVATE_KEY",
      ]
        .filter(Boolean)
        .join(", ")}`
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
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
