import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | undefined;
let adminAuth: Auth | undefined;

function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    app = getApps()[0] as App;
    adminAuth = getAuth(app);
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
}

function getAdminAuth(): Auth {
  if (!adminAuth) initFirebaseAdmin();
  return adminAuth!;
}

export async function verifyIdToken(token: string): Promise<{ uid: string }> {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  
  return { uid: decoded.uid };
}
