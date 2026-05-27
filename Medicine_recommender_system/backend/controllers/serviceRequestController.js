const { ServiceRequest, Consultation, User, ServiceItem, ServiceCategory } = require('../models');
const { Op } = require('sequelize');
const { sendPushNotification } = require('../utils/pushHelper');

// ── Helper: broadcast queue_updated to all patients waiting on a specialist ──
async function broadcastQueueUpdate(specialistId) {
  if (!global.io || !specialistId) return;
  const waitingRequests = await ServiceRequest.findAll({
    where: {
      specialist_id: specialistId,
      queue_status: { [Op.in]: ['waiting', 'active'] },
    },
    attributes: ['patient_id'],
  });
  const notified = new Set([specialistId]);
  for (const r of waitingRequests) {
    if (r.patient_id && !notified.has(r.patient_id)) {
      global.io.to(`user_${r.patient_id}`).emit('queue_updated');
      notified.add(r.patient_id);
    }
  }
  global.io.to(`user_${specialistId}`).emit('queue_updated');
}

// ── Helper: compute next queue number for a specialist ────────────────────────
async function getNextQueueNumber(specialistId) {
  const max = await ServiceRequest.max('queue_number', {
    where: { specialist_id: specialistId },
  });
  return (max || 0) + 1;
}

// @desc    Request a new service (Lab/Radiology)
// @route   POST /api/service-requests
// @access  Private (Doctor only)
exports.requestService = async (req, res) => {
  try {
    const { consultation_id, service_item_id, instructions } = req.body;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can request services' });
    }

    const consultation = await Consultation.findByPk(consultation_id);
    if (!consultation || consultation.doctor_id !== req.user.id) {
      return res.status(404).json({ message: 'Consultation not found or unauthorized' });
    }

    if (['referred', 'archived', 'completed'].includes(consultation.status)) {
      return res.status(400).json({ message: 'Cannot request services on a referred, archived, or completed consultation.' });
    }

    const serviceItem = await ServiceItem.findByPk(service_item_id, {
      include: [{ model: ServiceCategory, as: 'Category' }]
    });

    if (!serviceItem || !serviceItem.is_active) {
      return res.status(400).json({ message: 'Service item is invalid or inactive' });
    }

    const requiredCategory = serviceItem.Category.name;
    const requiredRole = serviceItem.Category.department_type === 'radiology' ? 'radiologist' : 'laboratorist';

    let assignedSpecialistId = null;

    // Attempt to find a specialist matching the required role and specialization
    let specialists = await User.findAll({
      where: {
        role: requiredRole,
        specializations: { [Op.contains]: [requiredCategory] }
      }
    });

    // Fallback: ANY specialist in that role
    if (specialists.length === 0) {
      specialists = await User.findAll({ where: { role: requiredRole } });
    }

    // Assign to the one with minimum active requests
    if (specialists.length > 0) {
      let minCount = Infinity;
      for (const spec of specialists) {
        const activeReqs = await ServiceRequest.count({
          where: {
            specialist_id: spec.id,
            queue_status: { [Op.in]: ['waiting', 'active'] },
          }
        });
        if (activeReqs < minCount) {
          minCount = activeReqs;
          assignedSpecialistId = spec.id;
        }
      }
    }

    // Assign sequential queue number for this specialist
    const queueNumber = assignedSpecialistId
      ? await getNextQueueNumber(assignedSpecialistId)
      : null;

    const serviceRequest = await ServiceRequest.create({
      consultation_id,
      patient_id: consultation.patient_id,
      doctor_id: req.user.id,
      specialist_id: assignedSpecialistId,
      service_item_id,
      service_type: serviceItem.Category.department_type,
      instructions,
      status: 'pending',
      queue_status: 'waiting',
      queue_number: queueNumber,
      price: serviceItem.price,
    });

    // Notify patient
    await sendPushNotification(
      consultation.patient_id,
      'New Medical Request',
      `Your doctor has requested a ${serviceItem.Category.department_type} service. Queue #${queueNumber || 'TBD'}.`,
      'service_request',
      '/patient'
    );

    // Notify specialist
    if (assignedSpecialistId) {
      const specialist = await User.findByPk(assignedSpecialistId, { attributes: ['role'] });
      const specialistPath = specialist?.role === 'radiologist' ? 'radiologist' : 'laboratorist';
      await sendPushNotification(
        assignedSpecialistId,
        'New Request Assigned',
        `A new medical request has been routed to you (Queue #${queueNumber}).`,
        'service_request',
        `/${specialistPath}?req_id=${serviceRequest.id}`
      );
      // Broadcast queue update to all patients of this specialist
      await broadcastQueueUpdate(assignedSpecialistId);
    }

    // Change consultation status
    consultation.status = 'waiting_for_results';
    await consultation.save();

    // Free up doctor
    const doctor = await User.findByPk(req.user.id);
    if (doctor) {
      doctor.availability_status = 'available';
      await doctor.save();
      const { triggerAutoAssignment } = require('./consultationController');
      triggerAutoAssignment().catch(e => console.error('Auto-assign error:', e));
    }

    res.status(201).json({ message: 'Service requested successfully', serviceRequest });
  } catch (error) {
    console.error('Error requesting service:', error);
    res.status(500).json({ message: 'Server error requesting service' });
  }
};

// @desc    Get pending service requests (for laboratorist/radiologist)
// @route   GET /api/service-requests
// @access  Private (laboratorist/radiologist only)
exports.getPendingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'laboratorist' && req.user.role !== 'radiologist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let queueStatuses = ['waiting', 'active'];
    if (req.query.history === 'true') {
      queueStatuses = ['completed'];
    }

    const requests = await ServiceRequest.findAll({
      where: {
        specialist_id: req.user.id,
        queue_status: queueStatuses,
        payment_status: 'paid',
      },
      include: [
        { model: User, as: 'Patient', attributes: ['id', 'name', 'age', 'sex'] },
        { model: User, as: 'Doctor', attributes: ['id', 'name', 'specialty', 'work_location', 'phone_number'] },
        { model: ServiceItem, as: 'ServiceItem', include: [{ model: ServiceCategory, as: 'Category' }] }
      ],
      order: [['queue_number', 'ASC'], ['created_at', 'ASC']],
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Server error fetching service requests' });
  }
};

// @desc    Accept/open a request — marks it active and updates queue positions
// @route   PUT /api/service-requests/:id/accept
// @access  Private (laboratorist/radiologist only)
exports.acceptRequest = async (req, res) => {
  try {
    if (req.user.role !== 'laboratorist' && req.user.role !== 'radiologist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const serviceReq = await ServiceRequest.findByPk(req.params.id);
    if (!serviceReq) return res.status(404).json({ message: 'Service request not found' });

    if (serviceReq.specialist_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this request' });
    }

    if (serviceReq.payment_status !== 'paid') {
      return res.status(403).json({ message: 'Cannot accept unpaid requests.' });
    }

    if (serviceReq.queue_status === 'completed') {
      return res.status(400).json({ message: 'Request is already completed.' });
    }

    // Mark as active (specialist opened/accepted it)
    serviceReq.queue_status = 'active';
    serviceReq.status = 'in_progress';
    await serviceReq.save();

    // Broadcast queue update — all waiting patients behind this one shift forward
    await broadcastQueueUpdate(serviceReq.specialist_id);

    // Notify the patient their request is now being handled
    await sendPushNotification(
      serviceReq.patient_id,
      'Request Being Processed',
      'A specialist has started processing your request.',
      'service_request',
      '/patient'
    );

    res.status(200).json({ message: 'Request accepted and marked active', serviceReq });
  } catch (error) {
    console.error('Error accepting service request:', error);
    res.status(500).json({ message: 'Server error accepting request' });
  }
};

// @desc    Update service status and upload results
// @route   PUT /api/service-requests/:id
// @access  Private (laboratorist/radiologist only)
exports.updateRequestStatus = async (req, res) => {
  try {
    if (req.user.role !== 'laboratorist' && req.user.role !== 'radiologist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, result_notes } = req.body;
    const reqId = req.params.id;

    const serviceReq = await ServiceRequest.findByPk(reqId);
    if (!serviceReq) return res.status(404).json({ message: 'Service request not found' });

    if (serviceReq.payment_status !== 'paid') {
      return res.status(403).json({ message: 'Cannot process unpaid requests. Patient must pay first.' });
    }

    // If transitioning to in_progress, also mark queue_status as active
    if (status === 'in_progress' && serviceReq.queue_status === 'waiting') {
      serviceReq.queue_status = 'active';
    }

    serviceReq.status = status || serviceReq.status;
    if (result_notes) serviceReq.result_notes = result_notes;

    if (req.file) {
      serviceReq.result_file_url = `/uploads/service-results/${req.file.filename}`;
      serviceReq.status = 'completed';
      serviceReq.queue_status = 'completed';
    }

    // If explicitly completing
    if (status === 'completed') {
      serviceReq.queue_status = 'completed';
    }

    await serviceReq.save();

    // Broadcast queue update to all affected patients
    await broadcastQueueUpdate(serviceReq.specialist_id);

    // Notify patient of this request
    if (serviceReq.patient_id) {
      global.io?.to(`user_${serviceReq.patient_id}`).emit('queue_updated');
    }

    if (req.file) {
      // Only notify the GP doctor if their consultation is still active (not referred)
      const gpConsultation = await Consultation.findByPk(serviceReq.consultation_id);
      if (gpConsultation && gpConsultation.status !== 'referred') {
        await sendPushNotification(
          serviceReq.doctor_id,
          'Test Result Uploaded',
          `A specialist has uploaded a result for Service Request #${serviceReq.id.substring(0, 5)}`,
          'result_uploaded',
          '/doctor'
        );
      }
    }

    res.status(200).json({ message: 'Service request updated', serviceReq });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Server error updating service request' });
  }
};

// @desc    Get service requests for a specific consultation
// @route   GET /api/service-requests/consultation/:consultationId
// @access  Private (Doctor & Patient)
exports.getConsultationRequests = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findByPk(consultationId);

    // Lab/rad cannot access a referred GP consultation
    if (consultation?.status === 'referred' &&
        (req.user.role === 'laboratorist' || req.user.role === 'radiologist')) {
      return res.status(403).json({ message: 'This GP consultation is closed after referral.' });
    }

    if (!consultation ||
      (req.user.role === 'patient' && consultation.patient_id !== req.user.id) ||
      (req.user.role === 'doctor' && consultation.doctor_id !== req.user.id)) {
      if (req.user.role !== 'company_admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const requests = await ServiceRequest.findAll({
      where: { consultation_id: consultationId },
      include: [
        { model: User, as: 'Specialist', attributes: ['name', 'work_location'] },
        { model: ServiceItem, as: 'ServiceItem', include: [{ model: ServiceCategory, as: 'Category' }] }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching consultation service requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient queue info for all their pending/active requests
// @route   GET /api/service-requests/queue
// @access  Private (Patient only)
exports.getPatientQueue = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pendingRequests = await ServiceRequest.findAll({
      where: { patient_id: req.user.id },
      include: [
        { model: User, as: 'Specialist', attributes: ['id', 'name', 'work_location'] },
        { model: Consultation, attributes: ['id'] },
        { model: User, as: 'Doctor', attributes: ['id', 'name', 'specialty', 'work_location'] },
        { model: ServiceItem, as: 'ServiceItem', include: [{ model: ServiceCategory, as: 'Category' }] }
      ],
      order: [['created_at', 'DESC']],
    });

    const queueData = await Promise.all(pendingRequests.map(async (request) => {
      const reqJSON = request.toJSON();
      let queue_position = null;
      let patients_ahead = 0;

      if (request.specialist_id && request.payment_status === 'paid' && request.queue_status === 'waiting') {
        patients_ahead = await ServiceRequest.count({
          where: {
            specialist_id: request.specialist_id,
            queue_status: 'waiting',
            queue_number: { [Op.lt]: request.queue_number },
          }
        });
        queue_position = patients_ahead + 1;
      } else if (request.queue_status === 'active') {
        queue_position = 0;
        patients_ahead = 0;
      }

      return {
        ...reqJSON,
        queue_position,
        patients_ahead,
      };
    }));

    res.status(200).json(queueData);
  } catch (error) {
    console.error('Error fetching patient queue:', error);
    res.status(500).json({ message: 'Server error fetching patient queue' });
  }
};
