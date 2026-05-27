const { Op } = require('sequelize');
const { ChatMessage, User } = require('../models');
const { assertConsultationAccess } = require('../utils/consultationAccess');

/**
 * Mark all unread messages from the other party as read.
 * @returns {{ message_ids: string[], read_at: Date } | null}
 */
async function markMessagesAsRead(consultationId, viewerId, chatType = null) {
  const where = {
    consultation_id: consultationId,
    sender_id: { [Op.ne]: viewerId },
    read_at: null,
  };
  if (chatType) {
    where.chat_type = chatType;
  }

  const unread = await ChatMessage.findAll({
    where,
    attributes: ['id'],
  });

  if (unread.length === 0) {
    return null;
  }

  const readAt = new Date();
  const messageIds = unread.map((m) => m.id);

  await ChatMessage.update(
    { read_at: readAt },
    { where: { id: { [Op.in]: messageIds } } }
  );

  return { message_ids: messageIds, read_at: readAt };
}

exports.markMessagesAsRead = markMessagesAsRead;

// @desc    Get chat history for a consultation
// @route   GET /api/chat/:consultationId
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const access = await assertConsultationAccess(req.user, req.params.consultationId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const messages = await ChatMessage.findAll({
      where: { consultation_id: req.params.consultationId },
      include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'role'] }],
      order: [['timestamp', 'ASC']]
    });

    const userRole = req.user.role; // 'patient' or 'doctor'
    
    // Filter out deleted messages
    const filteredMessages = messages.filter(msg => {
      if (msg.is_deleted_everyone) return false;
      if (userRole === 'patient' && msg.deleted_by_patient) return false;
      if (userRole === 'doctor' && msg.deleted_by_doctor) return false;
      return true;
    });

    res.status(200).json(filteredMessages);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
};

// @desc    Upload an attachment
// @route   POST /api/chat/upload
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Convert path slashes for URL format, returning relative URL for IP/localhost parity
    const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error uploading file' });
  }
};

// @desc    Mark messages in a consultation as read/seen by the current user
// @route   POST /api/chat/:consultationId/seen
// @access  Private
exports.markMessagesSeen = async (req, res) => {
  try {
    const access = await assertConsultationAccess(req.user, req.params.consultationId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const chatType = req.body?.chat_type || req.query?.chat_type || null;
    const result = await markMessagesAsRead(req.params.consultationId, req.user.id, chatType);

    if (result && global.io) {
      global.io.to(req.params.consultationId).emit('messages_seen', {
        consultation_id: req.params.consultationId,
        chat_type: chatType,
        message_ids: result.message_ids,
        read_at: result.read_at,
      });
    }

    res.status(200).json({
      message: 'Messages marked as seen',
      message_ids: result?.message_ids || [],
      read_at: result?.read_at || null,
    });
  } catch (error) {
    console.error('Mark messages seen error:', error);
    res.status(500).json({ message: 'Server error marking messages as seen' });
  }
};
