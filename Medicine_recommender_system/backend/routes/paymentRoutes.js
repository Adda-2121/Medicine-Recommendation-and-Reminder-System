const express = require('express');
const router = express.Router();
const { getPayments, verifyPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, authorize('company_admin'), getPayments);

router.put('/:id/verify', protect, authorize('company_admin'), verifyPayment);

module.exports = router;
