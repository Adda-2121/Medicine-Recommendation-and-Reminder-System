const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  consultation_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // null when entry_type = 'counseling'
  drug_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Psychological / counseling note — used when no drug is prescribed
  counseling_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  entry_type: {
    type: DataTypes.ENUM('medication', 'counseling'),
    defaultValue: 'medication',
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Prescription;
