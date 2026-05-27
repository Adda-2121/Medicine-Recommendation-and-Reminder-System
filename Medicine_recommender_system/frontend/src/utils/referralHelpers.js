/** Specialist types a GP may refer to (excludes GP). */
export const REFERRAL_SPECIALIST_TYPES = [
  'Psychiatrist',
  'Dermatologist',
  'Cardiologist',
  'Internal Medicine',
  'Pediatrician',
  'Gynecologist',
  'Pulmonologist',
  'Neurologist',
  'Orthopedic',
];

const GP_SPECIALTY_LABELS = [
  'general practitioner',
  'general practice',
  'gp',
];

export function isGpDoctor(user) {
  if (!user || user.role !== 'doctor') return false;
  const s = (user.specialty || '').trim().toLowerCase();
  return GP_SPECIALTY_LABELS.some((label) => s === label || s.includes(label));
}

/** Patient booked a GP-path consultation (not direct specialist). */
export function isGpConsultation(consultation) {
  if (!consultation) return false;
  if (consultation.consultation_type === 'specialist') return false;
  if (consultation.referred_by_id) return false;
  return true;
}

/**
 * Whether the Refer UI should appear and whether submit is allowed.
 * Only verified GP doctors can refer. Specialists, laboratorists, and
 * radiologists never see the referral button.
 */
export function getReferEligibility(consultation, user) {
  const out = { showButton: false, canSubmit: false, reason: '' };

  if (!consultation || !user || user.role !== 'doctor') {
    return out;
  }

  // Only GPs can refer — specialists must not see the button at all
  if (!isGpDoctor(user)) {
    return out;
  }

  if (!isGpConsultation(consultation)) {
    return out;
  }

  if (!consultation.doctor_id) {
    out.showButton = true;
    out.reason = 'No doctor assigned to this consultation yet';
    return out;
  }

  if (String(consultation.doctor_id) !== String(user.id)) {
    return out;
  }

  out.showButton = true;

  if (['referred', 'archived', 'completed'].includes(consultation.status)) {
    out.reason = 'This case was already referred or closed';
    return out;
  }

  if (consultation.Payment && consultation.Payment.status !== 'verified') {
    out.reason = 'Patient payment must be verified before referral';
    return out;
  }

  const allowedStatuses = [
    'pending',
    'active',
    'assigned',
    'in_progress',
    'result_ready',
    'waiting_for_results',
  ];

  if (!allowedStatuses.includes(consultation.status)) {
    out.reason = `Cannot refer while status is "${consultation.status}"`;
    return out;
  }

  out.canSubmit = true;
  return out;
}

/** @deprecated use getReferEligibility(...).canSubmit */
export function canGpReferConsultation(consultation, user) {
  return getReferEligibility(consultation, user).canSubmit;
}
