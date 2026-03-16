const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Map: userId -> { socketId, callId, displayName, joinTime }
const roomUsers = new Map();

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
    console.log(`🟢 User connected to socket: ${socket.displayName} (${socket.callId})`);

    const handleLeaveRoom = () => {
      if (!roomUsers.has(socket.userId)) return;
      socket.leave('global-room');
      const user = roomUsers.get(socket.userId);
      roomUsers.delete(socket.userId);
      
      const leaveTime = new Date().toISOString();
      io.to('global-room').emit('user-left', {
        callId: user.callId,
        displayName: user.displayName,
        timestamp: leaveTime
      });
      console.log(`🔴 ${socket.displayName} left the global room`);
    };

    socket.on('join-room', () => {
      if (socket.rooms.has('global-room')) {
        // Already in room, just return current list
        const activeUsers = Array.from(roomUsers.values()).filter(u => u.socketId !== socket.id);
        socket.emit('room-active-users', activeUsers);
        return;
      }

      socket.join('global-room');
      const joinTime = new Date().toISOString();
      
      roomUsers.set(socket.userId, {
        socketId: socket.id,
        callId: socket.callId,
        displayName: socket.displayName,
        joinTime
      });

      // Notify others in room
      socket.to('global-room').emit('user-joined', {
        socketId: socket.id,
        callId: socket.callId,
        displayName: socket.displayName,
        timestamp: joinTime
      });

      // Return current room users to the joiner
      const activeUsers = Array.from(roomUsers.values()).filter(u => u.socketId !== socket.id);
      socket.emit('room-active-users', activeUsers);
      console.log(`🟢 ${socket.displayName} joined the global room`);
    });

    socket.on('leave-room', handleLeaveRoom);
    
    socket.on('disconnect', () => {
      handleLeaveRoom();
      console.log(`🔴 User disconnected: ${socket.displayName} (${socket.callId})`);
    });

    // WebRTC Signaling for Mesh Network
    socket.on('offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('offer', {
        fromSocketId: socket.id,
        fromCallId: socket.callId,
        displayName: socket.displayName,
        offer
      });
    });

    socket.on('answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('answer', {
        fromSocketId: socket.id,
        answer
      });
    });

    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        fromSocketId: socket.id,
        candidate
      });
    });
  });
}

module.exports = setupSignaling;
