const { Payment, Consultation, User } = require('../models');
const { sendSMS } = require('../utils/smsService');
const fs = require('fs');
const path = require('path');




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

    if (status === 'verified') {
      const consultationController = require('./consultationController');
      if (consultationController.triggerAutoAssignment) {
        consultationController.triggerAutoAssignment();
      }
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


