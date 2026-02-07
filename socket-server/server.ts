import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Server } from "socket.io";
import { verifyIdToken } from "./firebase";
import {
  initSocketServer,
  addSocket,
  removeSocket,
  handleEmitRequest,
} from "./lib";

const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000";

interface SocketWithUserId {
  userId?: string;
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "POST" && req.url === "/internal/emit") {
    return handleEmitRequest(req, res);
  }
  res.writeHead(404);
  res.end("Not Found");
});

const io = new Server(httpServer, {
  path: "/socket.io",
  addTrailingSlash: false,
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

initSocketServer(io);

io.on("connection", async (socket) => {
  const token = socket.handshake.query.token;
  if (!token) {
    socket.disconnect(true);
    return;
  }

  const tokenStr = Array.isArray(token) ? token[0] : String(token);
  const cleanToken = tokenStr.startsWith("Bearer ")
    ? tokenStr.slice(7)
    : tokenStr;

  try {
    const { uid } = await verifyIdToken(cleanToken);
    (socket as SocketWithUserId).userId = uid;
    addSocket(uid, socket.id);
  } catch (err) {
    console.error("[Socket] Auth failed:", err);
    socket.disconnect(true);
    return;
  }

  socket.on("disconnect", () => {
    removeSocket(socket.id);
  });
});

httpServer.listen(SOCKET_PORT, () => {
  console.log(`[Socket] Ready on http://localhost:${SOCKET_PORT}`);
});
