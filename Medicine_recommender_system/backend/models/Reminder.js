const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const TreatmentPlan = require('./TreatmentPlan');
const User = require('./User');

const Reminder = sequelize.define('Reminder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  treatment_plan_id: {
    type: DataTypes.UUID,
    allowNull: true, // Optional linking to treatment plan
    references: {
      model: TreatmentPlan,
      key: 'id'
    }
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  reminder_type: {
    type: DataTypes.ENUM('medicine', 'follow_up', 'test'),
    allowNull: false,
  },
  medicine_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  medicine_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dose: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  frequency: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent'),
    defaultValue: 'pending',
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Reminder;
