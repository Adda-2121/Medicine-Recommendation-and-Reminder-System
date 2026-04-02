const express = require('express');
const router = express.Router();
const { requestConsultation, getConsultations, assignDoctor } = require('../controllers/consultationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, requestConsultation)
  .get(protect, getConsultations);

// Only admins can manually assign. (To do it automatically we would call assign logic internally when requested).
router.put('/:id/assign', protect, authorize('company_admin'), assignDoctor);

module.exports = router;
