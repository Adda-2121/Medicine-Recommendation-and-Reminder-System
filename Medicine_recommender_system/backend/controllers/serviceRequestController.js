const { ServiceRequest, Consultation, User, ServiceItem, ServiceCategory } = require('../models');
const { Op } = require('sequelize');
const { sendPushNotification } = require('../utils/pushHelper');

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
        specializations: {
          [Op.contains]: [requiredCategory]
        }
      }
    });

    // Fallback: ANY specialist in that role
    if (specialists.length === 0) {
      specialists = await User.findAll({
        where: { role: requiredRole }
      });
    }

    // Assign to the one with minimum active requests
    if (specialists.length > 0) {
      let minCount = Infinity;
      for (const spec of specialists) {
        const activeReqs = await ServiceRequest.count({
          where: {
            specialist_id: spec.id,
            status: { [Op.in]: ['pending', 'in_progress'] }
          }
        });
        if (activeReqs < minCount) {
          minCount = activeReqs;
          assignedSpecialistId = spec.id;
        }
      }
    }

    const serviceRequest = await ServiceRequest.create({
      consultation_id,
      patient_id: consultation.patient_id,
      doctor_id: req.user.id,
      specialist_id: assignedSpecialistId,
      service_item_id,
      service_type: serviceItem.Category.department_type,
      instructions,
      status: 'pending',
      price: serviceItem.price // Snapshot price
    });

    // Notify patient
    await sendPushNotification(
      consultation.patient_id,
      'New Medical Request',
      `Your doctor has requested a ${serviceItem.Category.department_type} service.`,
      'service_request',
      '/patient'
    );

    // Notify specialist
    if (assignedSpecialistId) {
      // Find the specialist's role to build the correct redirect URL
      const specialist = await User.findByPk(assignedSpecialistId, { attributes: ['role'] });
      const specialistPath = specialist?.role === 'radiologist' ? 'radiologist' : 'laboratorist';
      await sendPushNotification(
        assignedSpecialistId,
        'New Request Assigned',
        'A new medical request has been routed to you.',
        'service_request',
        `/${specialistPath}?req_id=${serviceRequest.id}`
      );
    }

        // Change consultation status
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

    res.status(201).json({ message: 'Service requested successfully', serviceRequest });
  } catch (error) {
    console.error('Error requesting service:', error);
    res.status(500).json({ message: 'Server error requesting service' });
  }
};

// @desc    Get pending service requests (for specialist)
// @route   GET /api/service-requests
// @access  Private (Specialist only)
exports.getPendingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'laboratorist' && req.user.role !== 'radiologist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let statuses = ['pending', 'in_progress'];
    if (req.query.history === 'true') {
      statuses = ['completed'];
    }

    const requests = await ServiceRequest.findAll({
      where: { 
        specialist_id: req.user.id,
        status: statuses,
        payment_status: 'paid' // Specialists should only see paid requests to process
      },
      attributes: { exclude: ['instructions'] },
      include: [
        { model: User, as: 'Patient', attributes: ['id', 'name', 'age', 'sex'] },
        { model: User, as: 'Doctor', attributes: ['id', 'name', 'specialty', 'work_location', 'phone_number'] },
        { model: ServiceItem, as: 'ServiceItem', include: [{ model: ServiceCategory, as: 'Category' }] }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Server error fetching service requests' });
  }
};

// @desc    Update service status and upload results
// @route   PUT /api/service-requests/:id
// @access  Private (Specialist only)
exports.updateRequestStatus = async (req, res) => {
  try {
    if (req.user.role !== 'laboratorist' && req.user.role !== 'radiologist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, result_notes } = req.body;
    const reqId = req.params.id;

    const serviceReq = await ServiceRequest.findByPk(reqId);
    if (!serviceReq) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    if (serviceReq.payment_status !== 'paid') {
      return res.status(403).json({ message: 'Cannot process unpaid requests. Patient must pay first.' });
    }

    serviceReq.status = status || serviceReq.status;
    if (result_notes) serviceReq.result_notes = result_notes;

    if (req.file) {
      serviceReq.result_file_url = `/uploads/service-results/${req.file.filename}`;
      serviceReq.status = 'completed';
    }

    await serviceReq.save();

    // Notify in real-time: the specialist's own queue count + all patients queued behind this request
    if (global.io) {
      // Notify the specialist so their queue count decreases
      global.io.to(`user_${serviceReq.specialist_id}`).emit('queue_updated');

      // Notify the patient of this request
      if (serviceReq.patient_id) {
        global.io.to(`user_${serviceReq.patient_id}`).emit('queue_updated');
      }

      // Notify all other patients queued with the same specialist so their position updates
      const affectedRequests = await ServiceRequest.findAll({
        where: {
          specialist_id: serviceReq.specialist_id,
          status: { [Op.in]: ['pending', 'in_progress'] },
          payment_status: 'paid'
        },
        attributes: ['patient_id']
      });
      const notified = new Set([serviceReq.patient_id, serviceReq.specialist_id]);
      for (const r of affectedRequests) {
        if (r.patient_id && !notified.has(r.patient_id)) {
          global.io.to(`user_${r.patient_id}`).emit('queue_updated');
          notified.add(r.patient_id);
        }
      }
    }

    if (req.file) {
      const { sendPushNotification } = require('../utils/pushHelper');
      await sendPushNotification(
        serviceReq.doctor_id,
        'Test Result Uploaded',
        `A specialist has uploaded a result for Service Request #${serviceReq.id.substring(0, 5)}`,
        'result_uploaded',
        '/doctor'
      );
    }

    res.status(200).json({ message: 'Service request updated', serviceReq });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Server error updating service request' });
  }
};

// @desc    Get service requests for a specific consultation
// @route   GET /api/consultations/:consultationId/service-requests
// @access  Private (Doctor & Patient)
exports.getConsultationRequests = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findByPk(consultationId);
    
    if (!consultation || (req.user.role === 'patient' && consultation.patient_id !== req.user.id) || (req.user.role === 'doctor' && consultation.doctor_id !== req.user.id)) {
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

// @desc    Get patient queue info for pending requests
// @route   GET /api/service-requests/queue
// @access  Private (Patient only)
exports.getPatientQueue = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pendingRequests = await ServiceRequest.findAll({
      where: {
        patient_id: req.user.id
      },
      include: [
        { model: User, as: 'Specialist', attributes: ['name', 'work_location'] },
        { model: Consultation, attributes: ['id'] },
        { model: User, as: 'Doctor', attributes: ['id', 'name', 'specialty', 'work_location'] },
        { model: ServiceItem, as: 'ServiceItem', include: [{ model: ServiceCategory, as: 'Category' }] }
      ]
    });

    const queueData = [];
    for (const req of pendingRequests) {
      let position = 0;
      let estimated_wait_time_mins = 0;

      if (req.specialist_id && req.payment_status === 'paid') {
        const earlierReqsCount = await ServiceRequest.count({
          where: {
            specialist_id: req.specialist_id,
            status: { [Op.in]: ['pending', 'in_progress'] },
            payment_status: 'paid',
            created_at: { [Op.lt]: req.created_at }
          }
        });
        position = earlierReqsCount + 1;
        estimated_wait_time_mins = position * 15;
      }

      queueData.push({
        ...req.toJSON(),
        queue_position: position,
        estimated_wait_time_mins
      });
    }

    res.status(200).json(queueData);
  } catch (error) {
    console.error('Error fetching patient queue:', error);
    res.status(500).json({ message: 'Server error fetching patient queue' });
  }
};
