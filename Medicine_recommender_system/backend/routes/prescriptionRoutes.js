const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', authorize('doctor'), prescriptionController.createPrescription);
router.get('/consultation/:consultationId', prescriptionController.getPrescriptionsByConsultation);
router.get('/patient', prescriptionController.getPrescriptionsByPatient);

module.exports = router;
