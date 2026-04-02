const express = require('express');
const router = express.Router();
const { submitPayment, getPayments, verifyPayment, deleteScreenshot } = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const setupUploadStorage = require('../utils/upload');

const upload = setupUploadStorage('payments');

router.route('/')
  .post(protect, authorize('patient'), upload.single('screenshot'), submitPayment)
  .get(protect, authorize('company_admin'), getPayments);

router.put('/:id/verify', protect, authorize('company_admin'), verifyPayment);
router.delete('/:id/screenshot', protect, authorize('patient'), deleteScreenshot);

module.exports = router;
