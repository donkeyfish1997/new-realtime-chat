import type { IncomingMessage, ServerResponse } from "http";
import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

const userSocketMap = new Map<string, Set<string>>();
const socketUserMap = new Map<string, string>();

export function initSocketServer(server: SocketIOServer) {
  io = server;
  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) throw new Error("Socket.IO server not initialized");
  return io;
}

export function addSocket(userId: string, socketId: string) {
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId)!.add(socketId);
  socketUserMap.set(socketId, userId);
}

export function removeSocket(socketId: string) {
  const userId = socketUserMap.get(socketId);
  if (userId) {
    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) userSocketMap.delete(userId);
    }
    socketUserMap.delete(socketId);
  }
}

function findSocketsByUserId(userId: string): string[] {
  const sockets = userSocketMap.get(userId) ?? new Set();
  return Array.from(sockets);
}

export function emitToUser(targetUserId: string, event: string, data: unknown) {
  const socketIds = findSocketsByUserId(targetUserId);
  const server = getSocketServer();
  socketIds.forEach((id) => server.to(id).emit(event, data));
}

export async function handleEmitRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const secret = process.env.SOCKET_EMIT_SECRET;
  if (secret) {
    const authHeader = req.headers["x-socket-emit-secret"];
    if (authHeader !== secret) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  try {
    const { targetUserId, event, data } = JSON.parse(body) as {
      targetUserId: string;
      event: string;
      data: unknown;
    };
    if (!targetUserId || !event) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing targetUserId or event" }));
      return;
    }
    emitToUser(targetUserId, event, data);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("[Socket] Emit request error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
