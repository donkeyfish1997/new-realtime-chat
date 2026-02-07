import type { Message } from "@/types/socket";
import {
  addSocket,
  emitToUser,
  getSocketServer,
  handleEmitRequest,
  initSocketServer,
  removeSocket,
} from "../../socket-server/lib";

export {
  addSocket,
  emitToUser,
  getSocketServer,
  handleEmitRequest,
  initSocketServer,
  removeSocket,
};

export function sendPrivateMessage(
  senderId: string,
  targetUserId: string,
  message: Message
) {
  emitToUser(targetUserId, "receive_private_message", message);
}

export function markMessagesAsRead(readerId: string, targetUserId: string) {
  emitToUser(targetUserId, "user_readed", { readerId });
}
