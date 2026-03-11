const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Map: internalId -> socketId
const onlineUsers = new Map();
// Map: socketId -> internalId
const socketToUser = new Map();

function setupSignaling(io) {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ internalId: decoded.userId });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.internalId;
      socket.callId = user.callId;
      socket.displayName = user.displayName;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 User connected: ${socket.displayName} (${socket.callId})`);

    // Register user as online
    onlineUsers.set(socket.userId, socket.id);
    socketToUser.set(socket.id, socket.userId);

    // Broadcast online status
    io.emit('user-online', { callId: socket.callId, displayName: socket.displayName });

    // Get online users list
    socket.on('get-online-users', async () => {
      const onlineList = [];
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (userId !== socket.userId) {
          const user = await User.findOne({ internalId: userId });
          if (user && user.displayName) {
            onlineList.push({
              callId: user.callId,
              displayName: user.displayName,
            });
          }
        }
      }
      socket.emit('online-users', onlineList);
    });

    // Initiate a call
    socket.on('call-user', async ({ targetCallId, offer }) => {
      const targetUser = await User.findOne({ callId: targetCallId });
      if (!targetUser) {
        socket.emit('call-error', { message: 'User not found' });
        return;
      }

      const targetSocketId = onlineUsers.get(targetUser.internalId);
      if (!targetSocketId) {
        socket.emit('call-error', { message: 'User is offline' });
        return;
      }

      // Send incoming call to target
      io.to(targetSocketId).emit('incoming-call', {
        from: {
          callId: socket.callId,
          displayName: socket.displayName,
        },
        offer,
      });

      console.log(`📞 ${socket.displayName} calling ${targetUser.displayName}`);
    });

    // Answer a call
    socket.on('call-answer', async ({ targetCallId, answer }) => {
      const targetUser = await User.findOne({ callId: targetCallId });
      if (!targetUser) return;

      const targetSocketId = onlineUsers.get(targetUser.internalId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('call-answered', {
        from: {
          callId: socket.callId,
          displayName: socket.displayName,
        },
        answer,
      });

      console.log(`✅ ${socket.displayName} answered call from ${targetUser.displayName}`);
    });

    // ICE candidate exchange
    socket.on('ice-candidate', async ({ targetCallId, candidate }) => {
      const targetUser = await User.findOne({ callId: targetCallId });
      if (!targetUser) return;

      const targetSocketId = onlineUsers.get(targetUser.internalId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('ice-candidate', {
        from: socket.callId,
        candidate,
      });
    });

    // Reject call
    socket.on('reject-call', async ({ targetCallId }) => {
      const targetUser = await User.findOne({ callId: targetCallId });
      if (!targetUser) return;

      const targetSocketId = onlineUsers.get(targetUser.internalId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('call-rejected', {
        by: {
          callId: socket.callId,
          displayName: socket.displayName,
        },
      });

      console.log(`❌ ${socket.displayName} rejected call from ${targetUser.displayName}`);
    });

    // End call
    socket.on('end-call', async ({ targetCallId }) => {
      const targetUser = await User.findOne({ callId: targetCallId });
      if (!targetUser) return;

      const targetSocketId = onlineUsers.get(targetUser.internalId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('call-ended', {
        by: {
          callId: socket.callId,
          displayName: socket.displayName,
        },
      });

      console.log(`📴 Call ended between ${socket.displayName} and ${targetUser.displayName}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${socket.displayName} (${socket.callId})`);
      onlineUsers.delete(socket.userId);
      socketToUser.delete(socket.id);

      // Broadcast offline status
      io.emit('user-offline', { callId: socket.callId });
    });
  });
}

module.exports = setupSignaling;
