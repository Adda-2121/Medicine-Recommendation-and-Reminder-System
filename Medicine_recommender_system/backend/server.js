require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize, ChatMessage } = require('./models');

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Setup Socket.IO securely with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // For development. Change to frontend URL in production
    methods: ['GET', 'POST']
  }
});

// Make io accessible globally for cron jobs
global.io = io;

// Socket.IO Connection Logic
io.on('connection', (socket) => {
  console.log(`User connected to Socket: ${socket.id}`);

  // Join a consultation room
  socket.on('join_consultation', (consultationId) => {
    socket.join(consultationId);
    console.log(`User joined consultation room: ${consultationId}`);
  });

  // Join a user-specific room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User joined personal room: user_${userId}`);
  });

  // Handle incoming chat messages
  socket.on('send_message', async (data) => {
    try {
      // Validate payment status before sending a message
      const { Payment } = require('./models');
      const payment = await Payment.findOne({ where: { consultation_id: data.consultation_id } });

      if (!payment || payment.status !== 'verified') {
        socket.emit('error_message', { message: 'Consultation is locked pending payment verification.' });
        return;
      }

      // data expects: { consultation_id, sender_id, message, attachment_url }
      const savedMessage = await ChatMessage.create({
        consultation_id: data.consultation_id,
        sender_id: data.sender_id,
        message: data.message || '',
        attachment_url: data.attachment_url || null
      });

      // Emit back to everyone in the room (including sender)
      io.to(data.consultation_id).emit('receive_message', savedMessage);
    } catch (error) {
      console.error('Socket message save error:', error);
    }
  });

  // Video Call Signaling
  socket.on('start_video_call', (data) => {
    // data expects: { consultation_id, initiator_id, initiator_name }
    console.log(`Video call started in room: ${data.consultation_id} by ${data.initiator_name}`);
    // Broadcast to the room (excluding sender) so they get an invitation popup
    socket.to(data.consultation_id).emit('incoming_video_call', {
      consultation_id: data.consultation_id,
      initiator_id: data.initiator_id,
      initiator_name: data.initiator_name,
      room_url: `HealthConnect-Consult-${data.consultation_id}`
    });
  });

  socket.on('end_video_call', (data) => {
    // data expects: { consultation_id }
    console.log(`Video call ended in room: ${data.consultation_id}`);
    socket.to(data.consultation_id).emit('video_call_ended', {
      consultation_id: data.consultation_id
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected from Socket: ${socket.id}`);
  });
});

// Test DB Connection and Start Server
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL Database connected successfully.');
    // Sync models (creates tables if they don't exist)
    return sequelize.sync({ alter: true }); 
  })
  .then(() => {
    // START the HTTP SERVER (which includes Socket.io) instead of app.listen
    server.listen(PORT, () => {
      console.log(`Server & WebSockets are running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
