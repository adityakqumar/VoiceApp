require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { apiLimiter } = require('./middleware/rateLimiter');
const setupSignaling = require('./socket/signaling');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const normalizeOrigin = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
      console.warn(
        `⚠️ CLIENT_URL entry "${trimmed}" includes path/query/hash. Using origin "${parsed.origin}" for CORS.`
      );
    }
    return parsed.origin;
  } catch {
    // If URL parsing fails (for custom/local setups), use a clean trimmed value.
    return trimmed.replace(/\/+$/, '');
  }
};

// Parse allowed origins (comma-separated for multiple domains)
const allowedOrigins = Array.from(
  new Set(
    CLIENT_URL.split(',')
      .map(normalizeOrigin)
      .filter(Boolean)
  )
);

// Trust proxy — required for rate limiting behind Railway/render reverse proxy
app.set('trust proxy', 1);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup WebRTC signaling
setupSignaling(io);

// Connect DB and start server
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 VoiceApp server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready for signaling`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}\n`);
  });
});
