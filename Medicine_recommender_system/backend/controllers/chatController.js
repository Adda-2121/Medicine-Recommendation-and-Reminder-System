const { ChatMessage, User } = require('../models');

// @desc    Get chat history for a consultation
// @route   GET /api/chat/:consultationId
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
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
