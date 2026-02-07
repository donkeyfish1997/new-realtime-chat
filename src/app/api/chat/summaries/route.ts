import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getUserIdFromRequest } from "@/lib/auth-api";

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getAdminDb();

  const convSnapshot = await db
    .collection("conversations")
    .where("participants", "array-contains", userId)
    .orderBy("lastMessageAt", "desc")
    .limit(20)
    .get();
try {
  const summaries = await Promise.all(
    convSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const participants = (data.participants || []) as string[];
      const partnerId = participants.find((p: string) => p !== userId) || userId;
      const lastMessage = data.lastMessage || {};
      const userDoc = await db.collection("users").doc(partnerId).get();
      const userData = userDoc.data() || {};

      const unreadSnapshot = await db
        .collection("messages")
        .where("conversationId", "==", doc.id)
        .where("senderId", "==", partnerId)
        .where("status", "!=", "READ")
        .get();

      return {
        conversationId: doc.id,
        unreadCount: unreadSnapshot.size,
        // isOnline: false,
        partner: {
          id: partnerId,
          name: userData.displayName || "Unknown",
          image: userData.photoURL || null,
        },
        lastMessage: {
          id: "",
          sender_id: (lastMessage as { senderId?: string }).senderId,
          content: (lastMessage as { content?: string }).content ?? "",
          created_at:
            (lastMessage as { createdAt?: { toDate?: () => Date } }).createdAt?.toDate?.()?.toISOString?.() ??
            String((lastMessage as { createdAt?: unknown }).createdAt ?? ""),
          status: "SENT",
        },
      };
    })
  );

  return NextResponse.json(summaries);
} catch (error) {
  console.error("Error getting chat summaries", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
 
}
