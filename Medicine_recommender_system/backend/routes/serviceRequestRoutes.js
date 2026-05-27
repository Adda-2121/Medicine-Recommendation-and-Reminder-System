const express = require('express');
const router = express.Router();
const {
  requestService,
  getPendingRequests,
  acceptRequest,
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

// Accept/open a request — marks active and shifts queue positions
router.put('/:id/accept', protect, acceptRequest);

router.route('/:id')
  .put(protect, upload.single('result_file'), updateRequestStatus);

module.exports = router;
