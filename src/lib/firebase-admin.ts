import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    app = getApps()[0] as App;
    adminAuth = getAuth(app);
    adminDb = getFirestore(app);
    return;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
  }

  let credentials: object;
  try {
    credentials = JSON.parse(serviceAccount) as object;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON");
  }

  app = initializeApp({ credential: cert(credentials) });
  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
}

export function getAdminAuth(): Auth {
  if (!adminAuth) initFirebaseAdmin();
  return adminAuth!;
}

export function getAdminDb(): Firestore {
  if (!adminDb) initFirebaseAdmin();
  return adminDb!;
}

export async function verifyIdToken(token: string): Promise<{ uid: string }> {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  return { uid: decoded.uid };
}
