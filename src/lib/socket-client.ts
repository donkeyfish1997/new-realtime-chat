"use client";

import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket";
import { auth } from "./firebase";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export async function createSocket(): Promise<ChatSocket> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (typeof window !== "undefined" &&
    window.location.origin === "http://localhost:3000"
      ? "http://localhost:3001"
      : "");
  const socket = io(socketUrl || undefined, {
    path: "/socket.io",
    query: { token },
    timeout: 5000,
    reconnection: true,
  }) as ChatSocket;

  return socket;
}
