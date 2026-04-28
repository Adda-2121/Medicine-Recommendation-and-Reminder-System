const express = require('express');
const cors = require('cors');

const app = express();
const authRoutes = require('./routes/authRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const treatmentRoutes = require('./routes/treatmentRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const chapaRoutes = require('./routes/chapaRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const drugRoutes = require('./routes/drugRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const settingRoutes = require('./routes/settingRoutes');

// Init Cron Jobs
require('./utils/reminderCron');
require('./utils/paymentCron');

const path = require('path');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/chapa', chapaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/settings', settingRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

module.exports = app;
