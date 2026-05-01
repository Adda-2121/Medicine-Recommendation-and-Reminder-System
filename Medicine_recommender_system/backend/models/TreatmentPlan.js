const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Consultation = require('./Consultation');

const TreatmentPlan = sequelize.define('TreatmentPlan', {
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
  medicine_recommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lifestyle_advice: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lab_test_needed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  follow_up_needed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_cured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  cured_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TreatmentPlan;
