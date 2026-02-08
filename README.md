# Realtime Chat (Next.js + Firebase + Socket.IO)

即時聊天室 MVP：Firebase Auth 登入、Firestore 儲存訊息、自架 Socket.IO 即時推送、MUI 介面。

## 技術棧

- **Next.js 15** (App Router)
- **Firebase Auth** - 登入 / 註冊 / 忘記密碼
- **Firestore** - 訊息與使用者儲存（不使用 Prisma / MySQL）
- **Socket.IO** - 即時訊息推送
- **MUI** - UI 元件

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定 Firebase

1. 在 [Firebase Console](https://console.firebase.google.com) 建立專案
2. 啟用 **Authentication**（Email/Password）
3. 啟用 **Firestore Database**
4. 取得 Web 設定與 Admin SDK Service Account 金鑰
5. 複製 `.env.example` 為 `.env.local` 並填入：

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Service Account JSON 字串（用於驗證 idToken）
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

6. 部署 Firestore 安全規則：`firestore.rules`
7. 建立 Firestore 索引（若查詢時出現錯誤，依照錯誤連結建立）

### 3. 啟動

```bash
npm run dev
```

開啟 http://localhost:3000

### 4. 即時訊息（Socket.IO）

開發時需同時啟動 Next.js 與 Socket server：

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:socket
```

### 5. Docker（含 Nginx 反向代理 + SSL）

```bash
# 複製 .env.example 為 .env 並填入 Firebase 等變數
cp .env.example .env

# 第一次：產生 SSL 憑證（二選一）
chmod +x scripts/generate-ssl-cert.sh
# 本機開發：自簽憑證（直接執行）
./scripts/generate-ssl-cert.sh
# 正式環境：Let's Encrypt（先讓 Nginx 跑起來、DNS 指到此機 80 後）
# DOMAIN=chat.example.com EMAIL=admin@example.com ./scripts/generate-ssl-cert.sh

# 啟動（對外 80→HTTPS 轉址、443 HTTPS，由 Nginx 轉發到 app / socket）
docker compose up --build
```

會啟動三個服務：
- **nginx** (80, 443) - 反向代理，80 自動轉址到 HTTPS，443 提供 SSL
- **app** - Next.js
- **socket** - Socket.IO（/socket.io/ 經 Nginx 轉發）

**本機 HTTPS**：用 `https://localhost` 或 `https://127.0.0.1` 開啟（自簽憑證需在瀏覽器手動信任）。`.env` 請設 `NEXT_PUBLIC_SOCKET_URL=https://localhost`、`SOCKET_CORS_ORIGIN=https://localhost`（或逗號分隔多個），再 `docker compose up --build`。

**正式環境**（Let's Encrypt 需要 Nginx 先跑在 80 上，驗證才能通過）：
1. 先產生自簽憑證讓 Nginx 能啟動：`./scripts/generate-ssl-cert.sh`（不設 DOMAIN/EMAIL）
2. 啟動服務：`docker compose up -d`
3. DNS 已指到此機 80 後，再取得正式憑證：`DOMAIN=你的網域 EMAIL=你的信箱 ./scripts/generate-ssl-cert.sh`
4. 重載 Nginx：`docker compose exec nginx nginx -s reload`

可選：設定 `SOCKET_EMIT_SECRET` 保護 Socket 的內部 emit API。

## 專案結構

```
├── socket-server/         # 獨立的 Socket.IO server
├── src/
│   ├── app/               # App Router 頁面與 API
│   ├── components/        # Chat、Auth 元件
│   ├── context/           # AuthProvider
│   ├── lib/               # Firebase、Socket、API client
│   └── types/
├── firestore.rules
└── firestore.indexes.json
```

## API

- `GET /api/chat/summaries` - 聊天列表（需 Authorization: Bearer &lt;idToken&gt;）
- `GET /api/chat/message/[targetUserId]` - 歷史訊息
- `POST /api/chat/message/[targetUserId]` - 發送訊息
- `POST /api/chat/read/[targetUserId]` - 標記已讀
- `GET /api/users/search?query=` - 搜尋使用者
- `GET /api/users/[userId]` - 取得使用者資訊
