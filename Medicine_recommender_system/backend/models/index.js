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
  if (models.Testimonial) {
    models.User.hasMany(models.Testimonial, { as: 'ReceivedTestimonials', foreignKey: 'provider_id' });
    models.User.hasMany(models.Testimonial, { as: 'SubmittedTestimonials', foreignKey: 'patient_id' });
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

  // Self-referential: a specialist consultation can be referred from a GP consultation
  models.Consultation.belongsTo(models.Consultation, { as: 'ReferredBy', foreignKey: 'referred_by_id' });
  models.Consultation.hasMany(models.Consultation, { as: 'Referrals', foreignKey: 'referred_by_id' });
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



if (models.ServiceCategory) {
  models.ServiceCategory.hasMany(models.ServiceItem, { foreignKey: 'category_id' });
}

if (models.ServiceItem) {
  models.ServiceItem.belongsTo(models.ServiceCategory, { as: 'Category', foreignKey: 'category_id' });
}

if (models.ServiceRequest) {
  models.ServiceRequest.belongsTo(models.Consultation, { foreignKey: 'consultation_id' });
  models.ServiceRequest.belongsTo(models.User, { as: 'Patient', foreignKey: 'patient_id' });
  models.ServiceRequest.belongsTo(models.User, { as: 'Doctor', foreignKey: 'doctor_id' });
  models.ServiceRequest.belongsTo(models.User, { as: 'Specialist', foreignKey: 'specialist_id' });
  models.ServiceRequest.belongsTo(models.ServiceItem, { as: 'ServiceItem', foreignKey: 'service_item_id' });

  if (models.Consultation) {
    models.Consultation.hasMany(models.ServiceRequest, { foreignKey: 'consultation_id' });
  }
}



if (models.Notification) {
  models.User.hasMany(models.Notification, { foreignKey: 'user_id' });
  models.Notification.belongsTo(models.User, { foreignKey: 'user_id' });
}

if (models.PushSubscription) {
  models.User.hasMany(models.PushSubscription, { foreignKey: 'user_id' });
  models.PushSubscription.belongsTo(models.User, { foreignKey: 'user_id' });
}

if (models.Testimonial) {
  models.Testimonial.belongsTo(models.User, { as: 'Patient', foreignKey: 'patient_id' });
  models.Testimonial.belongsTo(models.User, { as: 'Provider', foreignKey: 'provider_id' });
  // Since service_id is polymorphic (Consultation or ServiceRequest), we don't strict-link it in Sequelize 
  // without a polymorphic setup, but we can query it easily.
}

if (models.Prescription) {
  models.Prescription.belongsTo(models.Consultation, { foreignKey: 'consultation_id' });
  models.Prescription.belongsTo(models.Drug, { foreignKey: 'drug_id' });
  models.Prescription.belongsTo(models.User, { as: 'Patient', foreignKey: 'patient_id' });
  models.Prescription.belongsTo(models.User, { as: 'Doctor', foreignKey: 'doctor_id' });

  if (models.Consultation) {
    models.Consultation.hasMany(models.Prescription, { foreignKey: 'consultation_id' });
  }
  if (models.Drug) {
    models.Drug.hasMany(models.Prescription, { foreignKey: 'drug_id' });
  }
}

if (models.Referral) {
  models.Referral.belongsTo(models.User, { as: 'Patient', foreignKey: 'patient_id' });
  models.Referral.belongsTo(models.User, { as: 'GP', foreignKey: 'gp_id' });
  models.Referral.belongsTo(models.User, { as: 'Specialist', foreignKey: 'specialist_id' });
  models.Referral.belongsTo(models.Consultation, { as: 'GpConsultation', foreignKey: 'gp_consultation_id' });
  models.Referral.belongsTo(models.Consultation, { as: 'SpecialistConsultation', foreignKey: 'specialist_consultation_id' });

  if (models.Consultation) {
    models.Consultation.hasOne(models.Referral, { as: 'ReferralDetails', foreignKey: 'specialist_consultation_id' });
    models.Consultation.hasOne(models.Referral, { as: 'OriginatingReferral', foreignKey: 'gp_consultation_id' });
  }
}

models.sequelize = sequelize;
models.Setting = require('./Setting');
models.Testimonial = require('./Testimonial');
models.Drug = require('./Drug');
models.Prescription = require('./Prescription');
module.exports = models;
