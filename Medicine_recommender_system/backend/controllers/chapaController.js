const axios = require('axios');
const { ServiceRequest, User, Setting, Payment, Consultation } = require('../models');
const { encrypt3DES } = require('../utils/chapaEncryption');

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-d91z7eTLp8Hy9Ixm8WBE7kogZ8oWQB92';
const CHAPA_AUTH = `Bearer ${CHAPA_SECRET_KEY}`;

// @desc    Initialize Chapa Payment for a Service Request
// @route   POST /api/chapa/initialize
// @access  Private (Patient)
exports.initializePayment = async (req, res) => {
  try {
    const { service_request_id } = req.body;
    
    if (!service_request_id) {
      return res.status(400).json({ message: 'service_request_id is required' });
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can initiate payments.' });
    }

    const serviceReq = await ServiceRequest.findOne({
      where: { id: service_request_id, patient_id: req.user.id },
      include: [{ model: User, as: 'Patient' }]
    });

    if (!serviceReq) {
      return res.status(404).json({ message: 'Service request not found or unauthorized' });
    }

    if (serviceReq.payment_status === 'paid') {
      return res.status(400).json({ message: 'Service request is already paid' });
    }

    if (!serviceReq.price || isNaN(serviceReq.price) || Number(serviceReq.price) <= 0) {
      return res.status(400).json({ message: 'Invalid service request price' });
    }

    if (!serviceReq.Patient || !serviceReq.Patient.email) {
      return res.status(400).json({ message: 'Patient email is required for payment' });
    }

    // Generate unique transaction reference (must be <= 50 chars)
    // UUID is 36 chars, so we use a shorter prefix
    const tx_ref = `tx-${serviceReq.id.substring(0, 8)}-${Date.now()}`;

    // Prepare payload for Chapa
    const payload = {
      amount: Number(serviceReq.price).toString(),
      currency: 'ETB',
      email: serviceReq.Patient.email,
      first_name: serviceReq.Patient.name ? serviceReq.Patient.name.split(' ')[0] : 'Patient',
      last_name: serviceReq.Patient.name && serviceReq.Patient.name.split(' ').length > 1 ? serviceReq.Patient.name.split(' ').slice(1).join(' ') : 'User',
      tx_ref: tx_ref,
      callback_url: `${req.protocol}://${req.get('host')}/api/chapa/webhook`,
      return_url: `${req.headers.origin || 'http://localhost:5173'}/patient?payment_ref=${tx_ref}`,
      customization: {
        title: 'HealthConnect', // Max 16 chars
        description: `Payment for Medical Service` // Max 50 chars
      },
      meta: {
        invoices: [
          { key: "Service", value: serviceReq.ServiceItem?.name || "Medical Service" },
          { key: "Price", value: `${serviceReq.price} ETB` }
        ]
      }
    };

    // Use dynamic env key in case process.env changed after init
    const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-d91z7eTLp8Hy9Ixm8WBE7kogZ8oWQB92';
    const authHeader = `Bearer ${secretKey}`;

    // Call Chapa API
    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.status === 'success') {
      // Save tx_ref to service request for later verification
      serviceReq.chapa_tx_ref = tx_ref;
      await serviceReq.save();

      return res.status(200).json({ 
        message: 'Payment initialized successfully', 
        checkout_url: response.data.data.checkout_url 
      });
    } else {
      console.error('Chapa initialization returned non-success:', response.data);
      return res.status(400).json({ message: 'Failed to initialize payment with Chapa', details: response.data });
    }
  } catch (error) {
    console.error('Chapa init error:', error.response?.data || error.message);
    return res.status(500).json({ 
      message: 'Server error initializing payment',
      error: error.response?.data || error.message
    });
  }
};

// @desc    Verify Chapa Payment
// @route   GET /api/chapa/verify/:tx_ref
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: { Authorization: CHAPA_AUTH }
    });

    if (response.data.status === 'success') {
      if (tx_ref.startsWith('tx-cons-')) {
        // Handle consultation payment
        const payment = await Payment.findOne({ where: { chapa_tx_ref: tx_ref } });
        
        if (!payment) {
          return res.status(404).json({ message: 'Payment record not found' });
        }

        if (payment.status !== 'verified') {
          payment.status = 'verified';
          // 1-week subscription
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          payment.expires_at = expiresAt;
          await payment.save();
          
          // Update Referral status if applicable
          try {
            const Referral = require('../models/Referral');
            if (Referral) {
              const referral = await Referral.findOne({ where: { specialist_consultation_id: payment.consultation_id } });
              if (referral) {
                referral.status = 'assigned';
                await referral.save();
              }
            }
          } catch (err) {
            console.error('Error updating referral status on payment verification:', err);
          }

          // Trigger auto assignment now that payment is verified
          const consultationController = require('./consultationController');
          if (consultationController.triggerAutoAssignment) {
            consultationController.triggerAutoAssignment();
          }
        }

        return res.status(200).json({ message: 'Payment verified successfully', payment });
      } else {
        // Handle service request payment
        const serviceReq = await ServiceRequest.findOne({ where: { chapa_tx_ref: tx_ref } });
        
        if (!serviceReq) {
          return res.status(404).json({ message: 'Service request associated with this transaction not found' });
        }

        if (serviceReq.payment_status !== 'paid') {
          serviceReq.payment_status = 'paid';
          await serviceReq.save();
        }

        return res.status(200).json({ message: 'Payment verified successfully', service_request: serviceReq });
      }
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Chapa verify error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
};

// @desc    Initialize Chapa Payment for a Consultation
// @route   POST /api/chapa/initialize/consultation
// @access  Private (Patient)
exports.initializeConsultationPayment = async (req, res) => {
  try {
    const { payment_id } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({ message: 'payment_id is required' });
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can initiate payments.' });
    }

    const payment = await Payment.findOne({
      where: { id: payment_id, patient_id: req.user.id },
      include: [{ model: User, as: 'Patient' }, { model: Consultation, as: 'Consultation' }]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found or unauthorized' });
    }

    if (payment.status === 'verified') {
      return res.status(400).json({ message: 'Consultation is already paid' });
    }

    if (!payment.Patient || !payment.Patient.email) {
      return res.status(400).json({ message: 'Patient email is required for payment' });
    }

    // Use the amount already set on the payment record (set at consultation creation time)
    const price = payment.amount && Number(payment.amount) > 0 ? payment.amount : '100';

    payment.amount = price;

    // Generate unique transaction reference (must be <= 50 chars)
    const tx_ref = `tx-cons-${payment.id.substring(0, 8)}-${Date.now()}`;
    
    // Save tx_ref to payment
    payment.chapa_tx_ref = tx_ref;
    await payment.save();

    // Prepare payload for Chapa
    const payload = {
      amount: Number(price).toString(),
      currency: 'ETB',
      email: payment.Patient.email,
      first_name: payment.Patient.name ? payment.Patient.name.split(' ')[0] : 'Patient',
      last_name: payment.Patient.name && payment.Patient.name.split(' ').length > 1 ? payment.Patient.name.split(' ').slice(1).join(' ') : 'User',
      tx_ref: tx_ref,
      callback_url: `${req.protocol}://${req.get('host')}/api/chapa/webhook`,
      return_url: `${req.headers.origin || 'http://localhost:5173'}/consultations?payment_ref=${tx_ref}`,
      customization: {
        title: 'HealthConnect', // Max 16 chars
        description: `Consultation Subscription` // Max 50 chars
      },
      meta: {
        invoices: [
          { key: "Service", value: "Consultation 1-Week Subscription" },
          { key: "Price", value: `${price} ETB` }
        ]
      }
    };

    const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-d91z7eTLp8Hy9Ixm8WBE7kogZ8oWQB92';
    const authHeader = `Bearer ${secretKey}`;

    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.status === 'success') {
      return res.status(200).json({ 
        message: 'Payment initialized successfully', 
        checkout_url: response.data.data.checkout_url 
      });
    } else {
      console.error('Chapa initialization returned non-success:', response.data);
      return res.status(400).json({ message: 'Failed to initialize payment with Chapa', details: response.data });
    }
  } catch (error) {
    console.error('Chapa init consultation error:', error.response?.data || error.message);
    return res.status(500).json({ 
      message: 'Server error initializing payment',
      error: error.response?.data || error.message
    });
  }
};

// @desc    Cancel Chapa Payment
// @route   PUT /api/chapa/cancel/:tx_ref
// @access  Private
exports.cancelTransaction = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const response = await axios.put(`https://api.chapa.co/v1/transaction/cancel/${tx_ref}`, {}, {
      headers: { Authorization: CHAPA_AUTH }
    });
    res.status(200).json({ message: 'Transaction cancelled successfully', data: response.data });
  } catch (error) {
    console.error('Chapa cancel error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error cancelling payment', error: error.response?.data || error.message });
  }
};

// @desc    Get Supported Currencies
// @route   GET /api/chapa/currency_supported
// @access  Private
exports.getSupportedCurrencies = async (req, res) => {
  try {
    const response = await axios.get('https://api.chapa.co/v1/currency_supported', {
      headers: { Authorization: CHAPA_AUTH }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Chapa currency error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error fetching currencies', error: error.response?.data || error.message });
  }
};

// @desc    Initiate Transfer to Specialist
// @route   POST /api/chapa/transfers
// @access  Private
exports.initiateTransfer = async (req, res) => {
  try {
    const { account_name, account_number, amount, bank_code } = req.body;
    if (!account_name || !account_number || !amount || !bank_code) {
      return res.status(400).json({ message: 'account_name, account_number, amount, and bank_code are required' });
    }

    const tx_ref = `tx-transfer-${Date.now()}`;
    const payload = {
      account_name,
      account_number,
      amount: Number(amount).toString(),
      currency: "ETB",
      reference: tx_ref,
      bank_code
    };

    const response = await axios.post('https://api.chapa.co/v1/transfers', payload, {
      headers: {
        Authorization: CHAPA_AUTH,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ message: 'Transfer initiated successfully', data: response.data, reference: tx_ref });
  } catch (error) {
    console.error('Chapa transfer error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error initiating transfer', error: error.response?.data || error.message });
  }
};

// @desc    Verify Transfer
// @route   GET /api/chapa/transfers/verify/:tx_ref
// @access  Private
exports.verifyTransfer = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const response = await axios.get(`https://api.chapa.co/v1/transfers/verify/${tx_ref}`, {
      headers: { Authorization: CHAPA_AUTH }
    });
    res.status(200).json({ message: 'Transfer verified successfully', data: response.data });
  } catch (error) {
    console.error('Chapa transfer verify error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error verifying transfer', error: error.response?.data || error.message });
  }
};

// @desc    Direct Charge for Telebirr
// @route   POST /api/chapa/charge
// @access  Private (Patient)
exports.directCharge = async (req, res) => {
  try {
    const { service_request_id, phone } = req.body;

    if (!service_request_id || !phone) {
      return res.status(400).json({ message: 'service_request_id and phone are required' });
    }

    const serviceReq = await ServiceRequest.findOne({
      where: { id: service_request_id, patient_id: req.user.id },
      include: [{ model: User, as: 'Patient' }]
    });

    if (!serviceReq) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (serviceReq.payment_status === 'paid') {
      return res.status(400).json({ message: 'Service request is already paid' });
    }

    // tx_ref must be <= 50 chars
    const tx_ref = `telebirr-${serviceReq.id.substring(0, 8)}-${Date.now()}`;
    const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-d91z7eTLp8Hy9Ixm8WBE7kogZ8oWQB92';

    // In Chapa Direct Charge, the initial request is often just a POST with type=telebirr
    const payload = {
      amount: Number(serviceReq.price).toString(),
      currency: 'ETB',
      email: serviceReq.Patient.email,
      first_name: serviceReq.Patient.name ? serviceReq.Patient.name.split(' ')[0] : 'Patient',
      last_name: serviceReq.Patient.name && serviceReq.Patient.name.split(' ').length > 1 ? serviceReq.Patient.name.split(' ').slice(1).join(' ') : 'User',
      tx_ref: tx_ref,
      type: 'telebirr',
      phone: phone
    };

    const response = await axios.post('https://api.chapa.co/v1/charges?type=telebirr', payload, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.status === 'success') {
      serviceReq.chapa_tx_ref = tx_ref;
      await serviceReq.save();
      
      // Chapa returns success but often message="Charge attempted, OTP sent"
      return res.status(200).json({
        message: 'OTP sent to your phone',
        tx_ref: tx_ref,
        data: response.data
      });
    } else {
      console.error('Chapa direct charge failed:', response.data);
      return res.status(400).json({ message: 'Failed to initiate charge', details: response.data });
    }
  } catch (error) {
    console.error('Chapa charge error:', error.response?.data || error.message);
    return res.status(500).json({ 
      message: 'Server error initiating direct charge',
      error: error.response?.data || error.message
    });
  }
};

// @desc    Validate OTP for Telebirr
// @route   POST /api/chapa/validate-otp
// @access  Private (Patient)
exports.validateOtp = async (req, res) => {
  try {
    const { tx_ref, otp } = req.body;

    if (!tx_ref || !otp) {
      return res.status(400).json({ message: 'tx_ref and otp are required' });
    }

    const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-d91z7eTLp8Hy9Ixm8WBE7kogZ8oWQB92';
    const encryptionKey = process.env.CHAPA_ENCRYPTION_KEY || 'dc7KybuulKFGHqIvz2p0CPFd';

    // Encrypt the OTP secure object
    const secureData = JSON.stringify({ otp: otp.toString() });
    const encryptedClient = encrypt3DES(secureData, encryptionKey);

    const payload = {
      reference: tx_ref, // Sometimes Chapa requires 'reference' instead of 'tx_ref' in validation payload, or in URL
      client: encryptedClient
    };

    // Note: Chapa's validate endpoint
    const response = await axios.post('https://api.chapa.co/v1/validate?type=telebirr', payload, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.status === 'success') {
      const serviceReq = await ServiceRequest.findOne({ where: { chapa_tx_ref: tx_ref } });
      if (serviceReq) {
        serviceReq.payment_status = 'paid';
        await serviceReq.save();
      }

      return res.status(200).json({ message: 'Payment successful', data: response.data });
    } else {
      console.error('Chapa OTP validation failed:', response.data);
      return res.status(400).json({ message: 'OTP Validation failed', details: response.data });
    }
  } catch (error) {
    console.error('Chapa OTP error:', error.response?.data || error.message);
    return res.status(500).json({ 
      message: 'Server error validating OTP',
      error: error.response?.data || error.message
    });
  }
};

// @desc    Get Telebirr Settings
// @route   GET /api/chapa/telebirr-settings
// @access  Private
exports.getTelebirrSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: 'telebirr_payment_number' } });
    return res.status(200).json({
      phone: setting ? setting.value : '0994887044' // Default to requested test number
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching settings' });
  }
};
