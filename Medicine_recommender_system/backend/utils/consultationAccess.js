const { Consultation, Referral } = require('../models');

/**
 * Verify the user may access a consultation (chat, referral details, etc.).
 * After a GP refers a patient, the original GP consultation is locked:
 * - Patient cannot send new messages to the GP
 * - Lab/radiology cannot communicate back through the GP consultation
 * - Only the GP doctor (read-only history) and admin can still view it
 */
async function assertConsultationAccess(user, consultationId) {
  const consultation = await Consultation.findByPk(consultationId);
  if (!consultation) {
    return { ok: false, status: 404, message: 'Consultation not found.' };
  }

  if (user.role === 'company_admin') {
    return { ok: true, consultation };
  }

  // ── Referred consultation: lock all write access ──────────────────────────
  // The GP consultation is permanently closed after referral.
  // Patient and lab/rad roles cannot interact with it at all.
  if (consultation.status === 'referred') {
    if (user.role === 'patient') {
      // Patient can still VIEW history but cannot write — isChatWritable handles write blocking
      if (consultation.patient_id !== user.id) {
        return { ok: false, status: 403, message: 'Not authorized for this consultation.' };
      }
      return { ok: true, consultation }; // read-only; isChatWritable blocks writes
    }
    if (user.role === 'laboratorist' || user.role === 'radiologist') {
      return { ok: false, status: 403, message: 'This GP consultation is closed after referral. Lab/radiology communication is no longer permitted.' };
    }
    if (user.role === 'doctor') {
      // Only the original GP can view history (read-only)
      if (consultation.doctor_id === user.id) {
        return { ok: true, consultation };
      }
      return { ok: false, status: 403, message: 'Not authorized for this consultation.' };
    }
  }

  if (user.role === 'patient') {
    if (consultation.patient_id !== user.id) {
      return { ok: false, status: 403, message: 'Not authorized for this consultation.' };
    }
    return { ok: true, consultation };
  }

  if (user.role === 'doctor') {
    if (consultation.doctor_id === user.id) {
      return { ok: true, consultation };
    }
    const referral = await Referral.findOne({
      where: { specialist_consultation_id: consultationId, specialist_id: user.id },
    });
    if (referral) {
      return { ok: true, consultation };
    }
    return { ok: false, status: 403, message: 'Only the assigned specialist can access this consultation.' };
  }

  if (user.role === 'laboratorist' || user.role === 'radiologist') {
    // Lab/rad can only access consultations they have an active service request for
    const { ServiceRequest } = require('../models');
    const serviceReq = await ServiceRequest.findOne({
      where: { consultation_id: consultationId, specialist_id: user.id }
    });
    if (serviceReq) {
      return { ok: true, consultation };
    }
    return { ok: false, status: 403, message: 'Not authorized for this consultation.' };
  }

  return { ok: false, status: 403, message: 'Not authorized.' };
}

/**
 * Whether new chat messages are allowed on this consultation.
 * Referred consultations are immediately and permanently closed — no timer.
 */
function isChatWritable(consultation) {
  if (['completed', 'referred', 'archived', 'waiting_payment'].includes(consultation.status)) {
    return false;
  }
  // 24h prescription follow-up timer (non-referral cases only)
  if (consultation.closing_at && new Date() > new Date(consultation.closing_at)) {
    return false;
  }
  return true;
}

module.exports = { assertConsultationAccess, isChatWritable };
