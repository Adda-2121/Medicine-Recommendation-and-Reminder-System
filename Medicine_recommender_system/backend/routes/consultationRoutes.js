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
  clearHistory,
  getReferralDetails,
  getPatientReferrals,
} = require('../controllers/consultationController');
const { protect, authorize, verifiedProfessional } = require('../middlewares/authMiddleware');

// Public — triage rules for the booking form
router.get('/triage-rules', getTriageRules);

// Patient clears their completed consultation history
router.delete('/history', protect, authorize('patient'), clearHistory);

router.route('/')
  .post(protect, requestConsultation)
  .get(protect, getConsultations);

// Patient status categories (admin only) - must be before /:id routes
router.get('/patient-statuses', protect, authorize('company_admin'), getPatientStatuses);

// Patient referral summary for dashboard
router.get('/my-referrals', protect, authorize('patient'), getPatientReferrals);

// Doctor completes a consultation
router.put('/:id/complete', protect, authorize('doctor'), verifiedProfessional, completeConsultation);

// Doctor resumes a consultation after results are ready
router.put('/:id/resume', protect, authorize('doctor'), verifiedProfessional, resumeConsultation);

// GP refers patient to a specialist
router.post('/:id/refer', protect, authorize('doctor'), verifiedProfessional, referToSpecialist);

// Get referral details for specialist/patient
router.get('/:id/referral', protect, getReferralDetails);

// Only admins can manually assign.
router.put('/:id/assign', protect, authorize('company_admin'), assignDoctor);

module.exports = router;
