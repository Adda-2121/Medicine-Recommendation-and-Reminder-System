require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize, ChatMessage, Consultation, User } = require('./models');
const { sendPushNotification } = require('./utils/pushHelper');

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

      // data expects: { consultation_id, sender_id, message, attachment_url, chat_type }
      const savedMessage = await ChatMessage.create({
        consultation_id: data.consultation_id,
        sender_id: data.sender_id,
        message: data.message || '',
        attachment_url: data.attachment_url || null,
        chat_type: data.chat_type || 'patient'
      });

      // Emit back to everyone in the room (including sender)
      io.to(data.consultation_id).emit('receive_message', savedMessage);

      // Web Push Notification to recipient
      const consultationInfo = await Consultation.findByPk(data.consultation_id);
      if (consultationInfo) {
        const recipientId = data.sender_id === consultationInfo.patient_id ? consultationInfo.doctor_id : consultationInfo.patient_id;
        if (recipientId) {
          sendPushNotification(
            recipientId,
            'New Message',
            'You have received a new message in your consultation.',
            'chat',
            '/consultations'
          );
        }
      }
    } catch (error) {
      console.error('Socket message save error:', error);
    }
  });

  // Handle message deletion logic
  socket.on('delete_messages', async (data) => {
    try {
      // data expects: { consultation_id, message_ids: [], mode: 'me' | 'everyone', requester_id, requester_role }
      const { consultation_id, message_ids, mode, requester_id, requester_role } = data;
      
      for (const msgId of message_ids) {
        const msg = await ChatMessage.findByPk(msgId);
        if (!msg) continue;

        if (mode === 'everyone') {
          // Check if sender owns the message and it's within 10 minutes
          const isSender = msg.sender_id === requester_id;
          const timeDiff = Date.now() - new Date(msg.timestamp).getTime();
          const within10Mins = timeDiff <= 10 * 60 * 1000;
          
          if (isSender && within10Mins) {
            msg.is_deleted_everyone = true;
            await msg.save();
          }
        } else if (mode === 'me') {
          if (requester_role === 'patient') {
            msg.deleted_by_patient = true;
          } else if (requester_role === 'doctor') {
            msg.deleted_by_doctor = true;
          }
          await msg.save();
        }
      }

      // Tell everyone in the room that messages were deleted (so UI can remove them)
      io.to(consultation_id).emit('messages_deleted', { message_ids, mode, requester_role });
    } catch (error) {
      console.error('Socket message delete error:', error);
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
  .then(async () => {
    console.log('PostgreSQL Database connected successfully.');
    // Inject laboratorist into ENUM safely before sync
    try {
      await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'laboratorist';`);
      await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'radiologist';`);
      console.log('Ensure laboratorist and radiologist roles exist in ENUM');

      // Add new enum values for LabTest (if it still exists in db)
      await sequelize.query(`ALTER TYPE "enum_LabTests_status" ADD VALUE IF NOT EXISTS 'in_progress';`).catch(() => {});
      console.log('Ensure in_progress status exists in LabTest ENUM');

      // Add chat_type enum for ChatMessage
      await sequelize.query(`CREATE TYPE "enum_ChatMessages_chat_type" AS ENUM ('patient', 'laboratorist');`).catch(() => {});
      await sequelize.query(`ALTER TYPE "enum_ChatMessages_chat_type" ADD VALUE IF NOT EXISTS 'radiologist';`).catch(() => {});
      console.log('Ensure chat_type enum exists in ChatMessages');
    } catch (err) {
      // Ignore if type doesn't exist yet (first run) or other error
      console.error('Enum alteration error:', err.message);
    }
    
    // Seed default settings
    try {
      const { Setting } = require('./models');
      await Setting.findOrCreate({
        where: { key: 'consultation_fee' },
        defaults: { value: '100' }
      });
    } catch (err) {
      console.error('Error seeding settings:', err.message);
    }
    
    // Sync models (creates tables if they don't exist)
    return sequelize.sync({ alter: true }); 
  })
  .then(async () => {
    const drugController = require('./controllers/drugController');
    await drugController.autoSeedDrugs();
    
    // START the HTTP SERVER (which includes Socket.io) instead of app.listen
    server.listen(PORT, () => {
      console.log(`Server & WebSockets are running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
