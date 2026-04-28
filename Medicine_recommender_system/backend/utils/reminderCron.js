const cron = require('node-cron');
const { Op } = require('sequelize');
const { Reminder, User } = require('../models');
const sendEmail = require('./sendEmail');
const { sendPushNotification } = require('./pushHelper');

// Check every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // Find all pending reminders that are past due
    const remindersToProcess = await Reminder.findAll({
      where: {
        status: 'pending',
        scheduled_time: {
          [Op.lte]: now // scheduled time is less than or equal to now
        }
      },
      include: [{ model: User, as: 'Patient' }]
    });

    if (remindersToProcess.length > 0) {
      console.log(`Found ${remindersToProcess.length} pending reminder(s) to send.`);
      
      for (const reminder of remindersToProcess) {
        // Implement actual email notifications
        console.log(`Sending ${reminder.reminder_type} reminder to ${reminder.Patient.name}`);
        if (reminder.Patient && reminder.Patient.email) {
          try {
            let messageBody = `Hello ${reminder.Patient.name},\n\nThis is a reminder for your scheduled ${reminder.reminder_type.replace('_', ' ')}.\n\n`;
            if (reminder.reminder_type === 'medicine') {
              messageBody += `Details:\n`;
              if (reminder.medicine_name) messageBody += `- Medicine Name: ${reminder.medicine_name}\n`;
              if (reminder.medicine_type) messageBody += `- Type: ${reminder.medicine_type}\n`;
              if (reminder.dose) messageBody += `- Dose: ${reminder.dose}\n`;
              if (reminder.frequency) messageBody += `- Frequency: ${reminder.frequency}\n`;
              messageBody += `\n`;
            }
            messageBody += `Please log in to your dashboard to check details and manage your schedule.\n\nBest Regards,\nHealthConnect Team`;

            await sendEmail({
              email: reminder.Patient.email,
              subject: `HealthConnect ${reminder.reminder_type} Reminder`,
              message: messageBody
            });
          } catch (err) {
            console.error(`Failed to send email to ${reminder.Patient.email}:`, err);
          }
        }
        
        // Mark as sent
        reminder.status = 'sent';
        await reminder.save();
        
        // Push notification alert through web sockets
        if (global.io) {
          global.io.to(`user_${reminder.patient_id}`).emit('reminder_alert', reminder);
        }

        // Web Push notification
        await sendPushNotification(
          reminder.patient_id,
          `${reminder.reminder_type === 'medicine' ? 'Medicine' : 'Measurement'} Reminder`,
          `It's time for your scheduled reminder.`,
          'reminder',
          '/reminders'
        );
      }
    }
  } catch (error) {
    console.error('Reminder Cron Job Error:', error);
  }
});

console.log('Reminder Cron Job Initialized');
