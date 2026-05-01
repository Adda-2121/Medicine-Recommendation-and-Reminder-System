const express = require('express');
const router = express.Router();
const { requestConsultation, getConsultations, assignDoctor, getPatientStatuses, completeConsultation } = require('../controllers/consultationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, requestConsultation)
  .get(protect, getConsultations);

// Patient status categories (admin only) - must be before /:id routes
router.get('/patient-statuses', protect, authorize('company_admin'), getPatientStatuses);

// Doctor completes a consultation
router.put('/:id/complete', protect, authorize('doctor'), completeConsultation);

// Only admins can manually assign.
router.put('/:id/assign', protect, authorize('company_admin'), assignDoctor);

module.exports = router;
