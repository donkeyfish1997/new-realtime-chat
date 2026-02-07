import type { Message } from "@/types/socket";
import { emitToUser } from "./socket-server";

export async function emitToSocket(
  targetUserId: string,
  event: string,
  data: unknown
): Promise<void> {
  const baseUrl = process.env.SOCKET_SERVER_URL;
  if (baseUrl) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const secret = process.env.SOCKET_EMIT_SECRET;
    if (secret) {
      headers["X-Socket-Emit-Secret"] = secret;
    }
    const res = await fetch(`${baseUrl}/internal/emit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ targetUserId, event, data }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Socket emit failed: ${res.status} ${text}`);
    }
  } else {
    emitToUser(targetUserId, event, data);
  }
}

export function sendPrivateMessage(
  senderId: string,
  targetUserId: string,
  message: Message
): Promise<void> {
  return emitToSocket(targetUserId, "receive_private_message", message);
}

export function markMessagesAsRead(
  readerId: string,
  targetUserId: string
): Promise<void> {
  return emitToSocket(targetUserId, "user_readed", { readerId });
}
