const express = require('express');
const router = express.Router();
const { createTreatmentPlan, getTreatmentPlan, markAsCured } = require('../controllers/treatmentController');
const { protect, authorize, verifiedProfessional } = require('../middlewares/authMiddleware');

router.post('/', protect, authorize('doctor'), verifiedProfessional, createTreatmentPlan);
router.get('/:consultationId', protect, getTreatmentPlan);
router.put('/:consultationId/mark-cured', protect, authorize('doctor'), verifiedProfessional, markAsCured);

module.exports = router;
