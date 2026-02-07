# Socket.IO Server

獨立的 WebSocket server，與 Next.js 分開執行。

## 啟動

```bash
# 從專案根目錄
npm run dev:socket
```

會讀取根目錄的 `.env.local`（FIREBASE_SERVICE_ACCOUNT、SOCKET_PORT、SOCKET_CORS_ORIGIN 等）。

## 架構

- `server.ts` - 主程式，HTTP server + Socket.IO + 驗證
- `lib.ts` - Socket 邏輯（連線對應、emit）
- `firebase.ts` - Firebase Admin 驗證 token
