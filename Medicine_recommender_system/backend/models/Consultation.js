const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User'); // Import to define relation although we'll setup in index

const Consultation = sequelize.define('Consultation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: true, // Nullable initially before assignment
    references: {
      model: User,
      key: 'id'
    }
  },
  symptoms_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  report_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true, // true to not break old records
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: true, // true to not break old records
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'waiting_for_results', 'result_ready', 'completed'),
    defaultValue: 'pending',
  },
  severity_level: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'low',
  },
  queue_status: {
    type: DataTypes.ENUM('waiting', 'assigned', 'completed'),
    defaultValue: 'waiting',
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Consultation;
