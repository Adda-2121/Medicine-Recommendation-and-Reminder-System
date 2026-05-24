const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  gp_consultation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Consultations',
      key: 'id'
    }
  },
  specialist_consultation_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Consultations',
      key: 'id'
    }
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  gp_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  specialist_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  referral_note: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  urgency: {
    type: DataTypes.ENUM('routine', 'urgent', 'emergency'),
    defaultValue: 'routine',
  },
  status: {
    type: DataTypes.ENUM('pending_payment', 'assigned', 'in_progress', 'completed'),
    defaultValue: 'pending_payment',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'low',
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  remaining_payment: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Referral;
