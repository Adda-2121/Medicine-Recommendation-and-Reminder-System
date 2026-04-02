const { Payment, Consultation, User } = require('../models');
const { sendSMS } = require('../utils/smsService');
const fs = require('fs');
const path = require('path');


// @desc    Submit a payment screenshot
// @route   POST /api/payments
// @access  Private (Patient)
exports.submitPayment = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can submit payments' });
    }

    const { consultation_id, reference_code, amount, notes } = req.body;
    const file = req.file;

    if (!consultation_id || !reference_code || !file) {
      return res.status(400).json({ message: 'Missing required fields or screenshot' });
    }

    // Verify consultation exists and belongs to patient
    const consultation = await Consultation.findOne({
      where: { id: consultation_id, patient_id: req.user.id }
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found or unauthorized' });
    }

    const screenshot_url = `/uploads/payments/${file.filename}`;

    // Create payment record. Note: Assuming one payment per consultation is allowed.
    const existingPayment = await Payment.findOne({ where: { consultation_id } });
    if (existingPayment) {
      if (existingPayment.status === 'verified') {
        return res.status(400).json({ message: 'Payment is already verified' });
      }
      
      // Allow updating if it's failed, expired, or pending
      if (existingPayment.screenshot_url) {
        try {
          const oldPath = path.join(__dirname, '..', existingPayment.screenshot_url);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch(err) {
          console.error("Failed to delete old screenshot: ", err);
        }
      }

      existingPayment.screenshot_url = screenshot_url;
      existingPayment.reference_code = reference_code;
      existingPayment.amount = 800; // Fixed amount
      existingPayment.notes = notes;
      existingPayment.status = 'pending';
      existingPayment.admin_notes = null;
      existingPayment.expires_at = null; // Clear old expiry
      await existingPayment.save();
      
      return res.status(200).json({ message: 'Payment submitted successfully', payment: existingPayment });
    }

    const payment = await Payment.create({
      consultation_id,
      patient_id: req.user.id,
      reference_code,
      screenshot_url,
      amount: 800, // Fixed amount
      notes,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Payment submitted successfully',
      payment,
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ message: 'Server error submitting payment' });
  }
};

// @desc    Get all payments (for admin)
// @route   GET /api/payments
// @access  Private (Company Admin)
exports.getPayments = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const payments = await Payment.findAll({
      include: [
        { model: User, as: 'Patient', attributes: ['id', 'name', 'email'] },
        { model: Consultation, as: 'Consultation', attributes: ['id', 'reason', 'status'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};

// @desc    Verify or reject a payment
// @route   PUT /api/payments/:id/verify
// @access  Private (Company Admin)

exports.verifyPayment = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const { status, admin_notes } = req.body;
    
    if (!['verified', 'failed', 'expired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Patient', attributes: ['name', 'phone_number'] }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    payment.admin_notes = admin_notes;

    if (status === 'verified') {
      // Set expiration to 7 days from now
      payment.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else {
      payment.expires_at = null;
    }

    await payment.save();

    // SMS Notification Logic
    if (status === 'verified' && payment.Patient?.phone_number) {
      await sendSMS(
        payment.Patient.phone_number,
        `Hello ${payment.Patient.name}, your payment for Consultation #${payment.consultation_id} is VERIFIED. You can now chat with your doctor for 1 week.`
      );
    } else if (status === 'failed' && payment.Patient?.phone_number) {
      await sendSMS(
        payment.Patient.phone_number,
        `Hello ${payment.Patient.name}, your payment for Consultation #${payment.consultation_id} FAILED verification. Reason: ${admin_notes}`
      );
    } else if (status === 'expired' && payment.Patient?.phone_number) {
      await sendSMS(
        payment.Patient.phone_number,
        `Hello ${payment.Patient.name}, your 1-week consultation access has EXPIRED. Please re-subscribe to continue chatting with your doctor.`
      );
    }

    res.status(200).json({
      message: `Payment marked as ${status}`,
      payment,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
};

// @desc    Delete payment screenshot
// @route   DELETE /api/payments/:id/screenshot
// @access  Private (Patient)
exports.deleteScreenshot = async (req, res) => {
  try {
    const payment = await Payment.findOne({ where: { id: req.params.id, patient_id: req.user.id } });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Can only delete screenshot for pending payments' });
    }

    if (payment.screenshot_url) {
        try {
          const oldPath = path.join(__dirname, '..', payment.screenshot_url);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch(err) {
          console.error("Failed to delete screenshot: ", err);
        }
        payment.screenshot_url = null;
        await payment.save();
    }

    res.status(200).json({ message: 'Screenshot deleted successfully' });
  } catch (error) {
    console.error('Delete screenshot error:', error);
    res.status(500).json({ message: 'Server error deleting screenshot' });
  }
};
