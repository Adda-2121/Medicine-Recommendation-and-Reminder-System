const express = require('express');
const router = express.Router();
const { createTreatmentPlan, getTreatmentPlan, markAsCured } = require('../controllers/treatmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, createTreatmentPlan);
router.get('/:consultationId', protect, getTreatmentPlan);
router.put('/:consultationId/mark-cured', protect, authorize('doctor'), markAsCured);

module.exports = router;
