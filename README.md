# 📞 VoiceApp — Peer-to-Peer Voice Calling

A browser-based voice calling web application with privacy-first design. Users authenticate via email OTP, choose display names, and make WebRTC peer-to-peer voice calls. **Emails are never visible to other users.**

---

## Architecture

```
┌──────────────┐   Socket.IO (signaling)   ┌──────────────────┐
│   Next.js    │ ◄────────────────────────► │  Express Server  │
│  Frontend    │   REST API (JWT)           │  + Socket.IO     │
│  (TailwindCSS)│ ◄────────────────────────► │                  │
└──────┬───────┘                            └────────┬─────────┘
       │  WebRTC (peer-to-peer audio)                │
       │◄──────────────────────────────►│            │
       │                                     ┌───────┴────────┐
       │                                     │    MongoDB      │
       └─────────────────────────────────────┴────────────────┘
```

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js (App Router), TailwindCSS |
| Backend     | Node.js, Express, Socket.IO       |
| Database    | MongoDB + Mongoose                |
| Auth        | Email OTP + JWT                   |
| Voice       | WebRTC (peer-to-peer)             |
| Deployment  | Docker + Docker Compose           |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB running locally (or use Docker)

### 1. Clone & Install

```bash
# Install all dependencies
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Start MongoDB

```bash
# Option A: Local MongoDB
mongod

# Option B: Docker
docker run -d -p 27017:27017 --name voiceapp-mongo mongo:7
```

### 3. Start Development Servers

```bash
# Terminal 1: Start the backend
cd server && npm run dev

# Terminal 2: Start the frontend
cd client && npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health check**: http://localhost:5000/api/health

### 4. Test a Call

1. Open `http://localhost:3000` in **two browser tabs**
2. Sign up with different emails in each tab
3. Copy the Call ID from one user
4. Paste it in the other user's "Make a Call" field
5. Click Find → Call
6. Accept the incoming call in the other tab
7. Done — voice call established! 🎉

> **Note**: OTPs are printed to the **server console** during development.

---

## Docker Deployment

```bash
# Copy env template
cp .env.example .env

# Edit .env with your secrets
nano .env

# Build and start all services
docker-compose up --build -d
```

---

## API Routes

| Method | Endpoint                   | Auth     | Description                      |
|--------|---------------------------|----------|----------------------------------|
| POST   | `/api/auth/send-otp`      | Public   | Send OTP to email                |
| POST   | `/api/auth/verify-otp`    | Public   | Verify OTP, get JWT              |
| POST   | `/api/auth/set-display-name` | JWT   | Set public display name          |
| GET    | `/api/users/me`           | JWT      | Get own profile (no email)       |
| GET    | `/api/users/lookup/:callId` | JWT    | Lookup user by Call ID (no email)|
| GET    | `/api/health`             | Public   | Health check                     |

---

## WebRTC Call Flow

```
Caller                    Server                    Receiver
  │                         │                          │
  │── call-user (offer) ──►│── incoming-call ────────►│
  │                         │                          │
  │                         │◄── call-answer (answer)──│
  │◄── call-answered ──────│                          │
  │                         │                          │
  │── ice-candidate ──────►│── ice-candidate ────────►│
  │◄── ice-candidate ──────│◄── ice-candidate ────────│
  │                         │                          │
  │◄═══════ WebRTC P2P Audio Connection ═════════════►│
  │                         │                          │
  │── end-call ───────────►│── call-ended ───────────►│
```

---

## Socket.IO Events

| Event            | Direction     | Description                          |
|-----------------|---------------|--------------------------------------|
| `call-user`     | Client → Server | Initiate call with offer            |
| `incoming-call` | Server → Client | Notify receiver of incoming call    |
| `call-answer`   | Client → Server | Send answer to caller               |
| `call-answered` | Server → Client | Notify caller of accepted call      |
| `ice-candidate` | Bidirectional   | Exchange ICE candidates             |
| `reject-call`   | Client → Server | Reject incoming call                |
| `call-rejected` | Server → Client | Notify caller of rejection          |
| `end-call`      | Client → Server | End active call                     |
| `call-ended`    | Server → Client | Notify peer that call ended         |
| `user-online`   | Server → All    | User came online                    |
| `user-offline`  | Server → All    | User went offline                   |
| `online-users`  | Server → Client | List of currently online users      |

---

## Privacy & Security

- ✅ Emails stored in DB but **never returned in any API response**
- ✅ No email search endpoint
- ✅ OTPs hashed with bcrypt before storage
- ✅ JWT tokens with 7-day expiry
- ✅ Rate limiting on auth endpoints (5 req/min)
- ✅ Helmet security headers
- ✅ CORS restricted to client origin
- ✅ Display name validation (alphanumeric + basic chars only)
- ✅ Socket.IO connections authenticated with JWT

---

## Project Structure

```
VoiceApp/
├── server/
│   ├── config/db.js           # MongoDB connection
│   ├── models/User.js         # User schema (email private)
│   ├── models/Otp.js          # OTP schema with TTL
│   ├── middleware/auth.js      # JWT middleware
│   ├── middleware/rateLimiter.js
│   ├── routes/auth.js         # OTP auth routes
│   ├── routes/users.js        # User lookup routes
│   ├── socket/signaling.js    # WebRTC signaling
│   ├── index.js               # Server entry point
│   ├── Dockerfile
│   └── package.json
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css    # Design system
│   │   │   ├── layout.js      # Root layout
│   │   │   ├── providers.js   # Context providers
│   │   │   ├── page.js        # Landing (redirect)
│   │   │   ├── login/page.js  # Auth flow
│   │   │   └── dashboard/page.js  # Main app
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── IncomingCall.js
│   │   │   └── ActiveCall.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CallContext.js
│   │   └── lib/
│   │       ├── api.js         # REST client
│   │       ├── socket.js      # Socket.IO client
│   │       └── webrtc.js      # WebRTC helpers
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

---

## Cloud Deployment Notes

For production deployment:

1. **TURN Server**: Add a TURN server for reliable NAT traversal (Twilio, Metered, or self-hosted Coturn)
2. **Email Service**: Replace console OTP logging with SendGrid/Mailgun
3. **TLS**: Use HTTPS (required for WebRTC in production)
4. **JWT Secret**: Generate a strong random secret
5. **MongoDB**: Use a managed instance (Atlas, etc.)

---

## License

MIT
