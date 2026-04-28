const express = require('express');
const router = express.Router();
const {
  requestService,
  getPendingRequests,
  updateRequestStatus,
  getConsultationRequests,
  getPatientQueue
} = require('../controllers/serviceRequestController');
const { protect } = require('../middlewares/authMiddleware');
const setupUploadStorage = require('../utils/upload');
const upload = setupUploadStorage('service-results');

router.route('/')
  .post(protect, requestService)
  .get(protect, getPendingRequests);

router.get('/queue', protect, getPatientQueue);
router.get('/consultation/:consultationId', protect, getConsultationRequests);

router.route('/:id')
  .put(protect, upload.single('result_file'), updateRequestStatus);

module.exports = router;
