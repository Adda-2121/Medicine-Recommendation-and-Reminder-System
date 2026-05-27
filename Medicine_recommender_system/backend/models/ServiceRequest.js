const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceRequest = sequelize.define('ServiceRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  consultation_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
  doctor_id: {
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
  service_item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ServiceItems',
      key: 'id'
    }
  },
  service_type: {
    type: DataTypes.ENUM('laboratory', 'radiology'),
    allowNull: false,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid'),
    defaultValue: 'pending',
  },
  chapa_tx_ref: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  result_file_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  result_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  queue_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Sequential queue number per specialist, assigned at request creation time',
  },
  queue_status: {
    type: DataTypes.ENUM('waiting', 'active', 'completed'),
    defaultValue: 'waiting',
    comment: 'waiting = not yet opened, active = specialist opened/accepted, completed = done',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ServiceRequest;
