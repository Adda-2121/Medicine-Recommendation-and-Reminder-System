const express = require('express');
const router = express.Router();
const { createTreatmentPlan, getTreatmentPlan } = require('../controllers/treatmentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createTreatmentPlan);
router.get('/:consultationId', protect, getTreatmentPlan);

module.exports = router;
