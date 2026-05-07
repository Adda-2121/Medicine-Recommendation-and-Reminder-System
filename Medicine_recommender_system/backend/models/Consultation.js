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
  // Triage system fields
  reason_for_visit: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Triage key from TRIAGE_REASONS (e.g. mental_health, skin, heart_chest)',
  },
  assigned_specialization: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Resolved specialization from triage routing (e.g. Psychiatrist, GP)',
  },
  report_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: true,
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
  },
  // ── Workflow routing fields ──────────────────────────────────────────────
  // 'gp'         → routed to a General Practitioner
  // 'specialist' → routed directly to a named specialist type
  consultation_type: {
    type: DataTypes.ENUM('gp', 'specialist'),
    defaultValue: 'gp',
  },
  // When consultation_type = 'specialist', which specialty to route to
  target_specialty: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // When a GP refers this patient to a specialist, this points to the original GP consultation
  referred_by_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Consultations',
      key: 'id'
    }
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Consultation;
