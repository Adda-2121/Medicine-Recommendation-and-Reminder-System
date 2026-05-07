/**
 * Triage Controller
 * Deterministic rule-based routing — NO AI, NO NLP.
 * Input: reason_for_visit key → Output: assigned_specialization
 */
const { TRIAGE_REASONS, triageRoute } = require('../utils/triageRules');

// @desc    Get all triage categories (for dropdown)
// @route   GET /api/triage/categories
// @access  Public
exports.getCategories = (req, res) => {
  const categories = TRIAGE_REASONS.map(({ key, label, description, doctorType, specialty, routingNote }) => ({
    key,
    label,
    description,
    doctorType,
    specialty,
    routingNote,
  }));
  res.status(200).json({ categories });
};

// @desc    Assign a specialization based on reason_for_visit
// @route   POST /api/triage/assign
// @access  Private (Patient)
exports.assignSpecialization = (req, res) => {
  const { reason_for_visit } = req.body;

  if (!reason_for_visit) {
    return res.status(400).json({ message: 'reason_for_visit is required.' });
  }

  const result = triageRoute(reason_for_visit);
  const rule = TRIAGE_REASONS.find(r => r.key === reason_for_visit);

  if (!rule) {
    // Unknown key — GP fallback
    return res.status(200).json({
      reason_for_visit,
      assigned_specialization: 'General Practitioner',
      doctorType: 'gp',
      routingNote: 'A General Practitioner will assess your condition and refer you if needed.',
      is_fallback: true,
    });
  }

  return res.status(200).json({
    reason_for_visit,
    assigned_specialization: result.specialty || 'General Practitioner',
    doctorType: result.doctorType,
    routingNote: result.routingNote,
    is_fallback: result.doctorType === 'gp',
  });
};
