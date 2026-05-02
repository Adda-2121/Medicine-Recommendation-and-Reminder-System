const fs = require('fs');

const path = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/backend/controllers/serviceRequestController.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update requestService
const requestServicePatch = `    // Change consultation status
    consultation.status = 'waiting_for_results';
    await consultation.save();

    // Free up doctor
    const doctor = await User.findByPk(req.user.id);
    if (doctor) {
      doctor.availability_status = 'available';
      await doctor.save();
      
      // Trigger auto-assignment for the next patient
      const { triggerAutoAssignment } = require('./consultationController');
      triggerAutoAssignment().catch(e => console.error("Auto-assign error:", e));
    }

    res.status(201).json({ message: 'Service requested successfully', serviceRequest });`;

content = content.replace(
    /res\.status\(201\)\.json\(\{ message: 'Service requested successfully', serviceRequest \}\);/,
    requestServicePatch
);

// 2. Update updateRequestStatus
const updateStatusPatch = `    if (req.file) {
      serviceReq.result_file_url = \`/uploads/service-results/\${req.file.filename}\`;
      serviceReq.status = 'completed';
    } else if (status === 'completed') {
      serviceReq.status = 'completed';
    }

    await serviceReq.save();

    if (serviceReq.status === 'completed') {
      const consultation = await Consultation.findByPk(serviceReq.consultation_id);
      if (consultation && consultation.status !== 'result_ready') {
        consultation.status = 'result_ready';
        await consultation.save();
      }

      const { sendPushNotification } = require('../utils/pushHelper');
      await sendPushNotification(
        serviceReq.doctor_id,
        'Test Result Uploaded',
        \`A specialist has uploaded a result for Service Request #\${serviceReq.id.substring(0, 5)}\`,
        'result_uploaded',
        '/doctor'
      );
    }`;

content = content.replace(
    /    if \(req\.file\) \{\s*serviceReq\.result_file_url = [^\n]*\n\s*serviceReq\.status = 'completed';\s*\}\s*await serviceReq\.save\(\);\s*if \(req\.file\) \{\s*const \{ sendPushNotification[^\}]*\}\s*\}/,
    updateStatusPatch
);

fs.writeFileSync(path, content, 'utf8');
console.log('serviceRequestController patched');
