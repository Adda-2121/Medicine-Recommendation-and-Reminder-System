const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true, // Prevents duplicate devices having same subscription repeatedly
  },
  p256dh: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  auth: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PushSubscription;
