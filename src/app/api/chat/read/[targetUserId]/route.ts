import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getUserIdFromRequest } from "@/lib/auth-api";
import { markMessagesAsRead } from "@/lib/socket-emit-client";
import { getConversationId } from "@/lib/get-conversation-id";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ targetUserId: string }> }
) {
  const userId = await getUserIdFromRequest(_req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await params;
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  }

  const db = getAdminDb();
  const conversationId = getConversationId(userId, targetUserId);

  const snapshot = await db
    .collection("messages")
    .where("conversationId", "==", conversationId)
    .where("senderId", "==", targetUserId)
    .where("status", "!=", "READ")
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { status: "READ" });
  });
  await batch.commit();

  await markMessagesAsRead(userId, targetUserId);

  return NextResponse.json({ success: true });
}
