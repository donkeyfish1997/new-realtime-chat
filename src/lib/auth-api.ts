import { verifyIdToken } from "./firebase-admin";

export async function getUserIdFromRequest(
  req: Request
): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const { uid } = await verifyIdToken(token);
    return uid;
  } catch {
    return null;
  }
}
