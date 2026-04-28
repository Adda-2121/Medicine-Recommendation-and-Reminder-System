const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('company_admin', 'doctor', 'patient', 'laboratorist', 'radiologist'),
    defaultValue: 'patient',
  },
  specializations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  work_location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sex: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Default to false, even for patients, but we only really care about this for doctors
  },
  availability_status: {
    type: DataTypes.ENUM('available', 'busy', 'offline'),
    defaultValue: 'offline',
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  license_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  experience_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  license_issuing_authority: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  license_expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  verification_document: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  selfie_document: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
  },
  resetOtp: {
    type: DataTypes.STRING,
  },
  resetOtpExpire: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
