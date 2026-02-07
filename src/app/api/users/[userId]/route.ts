import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getUserIdFromRequest } from "@/lib/auth-api";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUserId = await getUserIdFromRequest(req);
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const db = getAdminDb();
  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data = doc.data() || {};
  return NextResponse.json({
    id: doc.id,
    name: data.displayName || data.email?.split("@")[0] || "Unknown",
    email: data.email,
    image: data.photoURL || null,
  });
}
