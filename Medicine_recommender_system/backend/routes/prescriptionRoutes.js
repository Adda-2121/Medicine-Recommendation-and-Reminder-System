const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, authorize, verifiedProfessional } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', authorize('doctor'), verifiedProfessional, prescriptionController.createPrescription);
router.get('/consultation/:consultationId', prescriptionController.getPrescriptionsByConsultation);
router.get('/patient', prescriptionController.getPrescriptionsByPatient);
router.get('/doctor', authorize('doctor'), verifiedProfessional, prescriptionController.getPrescriptionsByDoctor);

module.exports = router;
