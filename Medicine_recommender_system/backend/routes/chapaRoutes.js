const express = require('express');
const router = express.Router();
const { initializePayment, initializeConsultationPayment, verifyPayment, cancelTransaction, getSupportedCurrencies, initiateTransfer, verifyTransfer, directCharge, validateOtp, getTelebirrSettings } = require('../controllers/chapaController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/initialize', protect, initializePayment);
router.post('/initialize/consultation', protect, initializeConsultationPayment);
router.get('/verify/:tx_ref', protect, verifyPayment);
router.put('/cancel/:tx_ref', protect, cancelTransaction);
router.get('/currency_supported', protect, getSupportedCurrencies);

// Transfers
router.post('/transfers', protect, initiateTransfer);
router.get('/transfers/verify/:tx_ref', protect, verifyTransfer);

// Telebirr Direct API
router.post('/charge', protect, directCharge);
router.post('/validate-otp', protect, validateOtp);
router.get('/telebirr-settings', protect, getTelebirrSettings);

module.exports = router;
