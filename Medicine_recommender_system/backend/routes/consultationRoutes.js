const express = require('express');
const router = express.Router();
const {
  requestConsultation,
  getConsultations,
  assignDoctor,
  getPatientStatuses,
  completeConsultation,
  resumeConsultation,
  referToSpecialist,
  getTriageRules,
} = require('../controllers/consultationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public — triage rules for the booking form
router.get('/triage-rules', getTriageRules);

router.route('/')
  .post(protect, requestConsultation)
  .get(protect, getConsultations);

// Patient status categories (admin only) - must be before /:id routes
router.get('/patient-statuses', protect, authorize('company_admin'), getPatientStatuses);

// Doctor completes a consultation
router.put('/:id/complete', protect, authorize('doctor'), completeConsultation);

// Doctor resumes a consultation after results are ready
router.put('/:id/resume', protect, authorize('doctor'), resumeConsultation);

// GP refers patient to a specialist
router.post('/:id/refer', protect, authorize('doctor'), referToSpecialist);

// Only admins can manually assign.
router.put('/:id/assign', protect, authorize('company_admin'), assignDoctor);

module.exports = router;
