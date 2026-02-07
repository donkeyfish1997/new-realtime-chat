import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getUserIdFromRequest } from "@/lib/auth-api";
import { sendPrivateMessage } from "@/lib/socket-emit-client";
import { getConversationId } from "@/lib/get-conversation-id";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ targetUserId: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing targetUserId" },
        { status: 400 },
      );
    }

    let body: { message: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { message } = body;
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const db = getAdminDb();
    const conversationId = getConversationId(userId, targetUserId);
    const now = new Date();

    const participants = [userId, targetUserId].sort();
    const docRef = await db.collection("messages").add({
      conversationId,
      senderId: userId,
      content: message.trim(),
      createdAt: now,
      status: "SENT",
      participants,
    });

    await db
      .collection("conversations")
      .doc(conversationId)
      .set(
        {
          participants,
          lastMessage: {
            senderId: userId,
            content: message.trim(),
            createdAt: now,
          },
          lastMessageAt: now,
          updatedAt: now,
        },
        { merge: true },
      );

    const messageData = {
      id: docRef.id,
      conversationId,
      senderId: userId,
      sender_id: userId,
      content: message.trim(),
      createdAt: now.toISOString(),
      created_at: now.toISOString(),
      status: "SENT" as const,
    };

  await sendPrivateMessage(userId, targetUserId, messageData);

  return NextResponse.json(messageData);
  } catch (error) {
    console.log('error in POST /api/chat/message/[targetUserId]: ',error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ targetUserId: string }> },
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await params;
  if (!targetUserId) {
    return NextResponse.json(
      { error: "Missing targetUserId" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const cursorLastTime = searchParams.get("cursorLastTime");
  const limitCount = Math.min(
    parseInt(searchParams.get("limit") || "50", 10) || 50,
    100,
  );

  const db = getAdminDb();
  const conversationId = getConversationId(userId, targetUserId);

  const snapshot = await db
    .collection("messages")
    .where("conversationId", "==", conversationId)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get();
  const messages = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      conversationId: data.conversationId,
      sender_id: data.senderId,
      content: data.content,
      created_at:
        data.createdAt?.toDate?.()?.toISOString() ??
        (data.createdAt instanceof Date
          ? data.createdAt.toISOString()
          : String(data.createdAt)),
      status: data.status || "SENT",
    };
  });

  return NextResponse.json(messages);
}
