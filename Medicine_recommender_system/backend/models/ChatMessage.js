const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Consultation = require('./Consultation');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  consultation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Consultation,
      key: 'id'
    }
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true, // Might be null if it's just an attachment
  },
  attachment_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chat_type: {
    type: DataTypes.ENUM('patient', 'laboratorist'),
    defaultValue: 'patient',
  },
  deleted_by_patient: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deleted_by_doctor: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_deleted_everyone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the recipient opened/read this message',
  },
}, {
  timestamps: true, // Adds createdAt automatically for timestamping
  createdAt: 'timestamp',
  updatedAt: false
});

module.exports = ChatMessage;
