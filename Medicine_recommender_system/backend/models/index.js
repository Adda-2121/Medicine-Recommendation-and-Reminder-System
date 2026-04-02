const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const models = {};

// Auto-load all models
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    models[model.name] = model;
  });

// Setup relationships
if (models.User) {
  models.User.hasMany(models.Consultation, { as: 'PatientConsultations', foreignKey: 'patient_id' });
  models.User.hasMany(models.Consultation, { as: 'DoctorConsultations', foreignKey: 'doctor_id' });
  models.User.hasMany(models.ChatMessage, { foreignKey: 'sender_id' });
  models.User.hasMany(models.Reminder, { foreignKey: 'patient_id' });
  if (models.Availability) {
    models.User.hasMany(models.Availability, { as: 'Availabilities', foreignKey: 'doctor_id' });
  }
}

if (models.Availability) {
  models.Availability.belongsTo(models.User, { foreignKey: 'doctor_id' });
}

if (models.Consultation) {
  models.Consultation.belongsTo(models.User, { as: 'Patient', foreignKey: 'patient_id' });
  models.Consultation.belongsTo(models.User, { as: 'Doctor', foreignKey: 'doctor_id' });

  models.Consultation.hasMany(models.ChatMessage, { foreignKey: 'consultation_id' });
  models.Consultation.hasOne(models.TreatmentPlan, { foreignKey: 'consultation_id' });
  models.Consultation.hasOne(models.Payment, { as: 'Payment', foreignKey: 'consultation_id' });
}

if (models.Payment) {
  models.Payment.belongsTo(models.Consultation, { as: 'Consultation', foreignKey: 'consultation_id' });
  models.Payment.belongsTo(models.User, { as: 'Patient', foreignKey: 'patient_id' });
}

if (models.TreatmentPlan) {
  models.TreatmentPlan.belongsTo(models.Consultation, { foreignKey: 'consultation_id' });
  models.TreatmentPlan.hasMany(models.Reminder, { foreignKey: 'treatment_plan_id' });
}

if (models.ChatMessage) {
  models.ChatMessage.belongsTo(models.Consultation, { foreignKey: 'consultation_id' });
  models.ChatMessage.belongsTo(models.User, { as: 'Sender', foreignKey: 'sender_id' });
}

if (models.Reminder) {
  models.Reminder.belongsTo(models.TreatmentPlan, { foreignKey: 'treatment_plan_id' });
  models.Reminder.belongsTo(models.User, { as: 'Patient', foreignKey: 'patient_id' });
}

models.sequelize = sequelize;
module.exports = models;
