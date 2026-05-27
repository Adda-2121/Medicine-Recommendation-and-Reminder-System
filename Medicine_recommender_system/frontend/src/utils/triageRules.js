/**
 * Triage Rules — deterministic, rule-based routing.
 * NO AI, NO NLP. Input: reason_for_visit string → Output: doctor type.
 *
 * Rules:
 *  - One reason → exactly one doctor type
 *  - GP is always the fallback for unclear or safety-first cases
 *  - Heart/chest → GP (safety-first, not Cardiologist directly)
 *  - Not sure / Other → GP
 */

export const TRIAGE_REASONS = [
  {
    key: 'mental_health',
    label: 'Mental health concerns',
    emoji: '🧠',
    description: 'Anxiety, depression, stress, mood changes',
    doctorType: 'specialist',
    specialty: 'Psychiatrist',
    routingNote: 'Mental health concerns are best handled by a Psychiatrist.',
  },
  {
    key: 'skin',
    label: 'Skin problems',
    emoji: '🔬',
    description: 'Rashes, acne, eczema, skin infections',
    doctorType: 'specialist',
    specialty: 'Dermatologist',
    routingNote: 'Skin conditions are best evaluated by a Dermatologist.',
  },
  {
    key: 'heart_chest',
    label: 'Heart / chest issues',
    emoji: '❤️',
    description: 'Chest pain, palpitations, shortness of breath',
    doctorType: 'specialist',
    specialty: 'Cardiologist',
    routingNote: 'Heart and chest symptoms are best evaluated by a Cardiologist.',
  },
  {
    key: 'general_illness',
    label: 'General illness',
    emoji: '🏥',
    description: 'Fever, fatigue, body aches, general discomfort',
    doctorType: 'specialist',
    specialty: 'Internal Medicine',
    routingNote: 'General illness is best managed by an Internal Medicine specialist.',
  },
  {
    key: 'child_health',
    label: 'Child health',
    emoji: '👶',
    description: 'Child illness, growth concerns, vaccinations',
    doctorType: 'specialist',
    specialty: 'Pediatrician',
    routingNote: 'Child health concerns are best handled by a Pediatrician.',
  },
  {
    key: 'womens_health',
    label: "Women's health",
    emoji: '🌸',
    description: 'Menstrual issues, pregnancy, reproductive health',
    doctorType: 'specialist',
    specialty: 'Gynecologist',
    routingNote: "Women's health concerns are best handled by a Gynecologist.",
  },
  {
    key: 'breathing',
    label: 'Breathing problems',
    emoji: '🫁',
    description: 'Asthma, chronic cough, breathing difficulty',
    doctorType: 'specialist',
    specialty: 'Pulmonologist',
    routingNote: 'Breathing problems are best evaluated by a Pulmonologist.',
  },
  {
    key: 'brain_nerve',
    label: 'Brain / nerve issues',
    emoji: '🧬',
    description: 'Headaches, dizziness, numbness, seizures',
    doctorType: 'specialist',
    specialty: 'Neurologist',
    routingNote: 'Neurological symptoms are best assessed by a Neurologist.',
  },
  {
    key: 'bone_joint',
    label: 'Bone / joint problems',
    emoji: '🦴',
    description: 'Joint pain, fractures, back pain, arthritis',
    doctorType: 'specialist',
    specialty: 'Orthopedic',
    routingNote: 'Bone and joint problems are best handled by an Orthopedic specialist.',
  },
  {
    key: 'not_sure',
    label: 'Not sure / Other',
    emoji: '❓',
    description: 'Unsure about symptoms, or something not listed above',
    doctorType: 'gp',
    specialty: 'General Practitioner',
    routingNote: 'A General Practitioner will assess your condition and refer you if needed.',
  },
];

/**
 * Deterministic triage function.
 * @param {string} reasonKey - key from TRIAGE_REASONS
 * @returns {{ doctorType: 'gp'|'specialist', specialty: string|null, routingNote: string }}
 */
export function triageRoute(reasonKey) {
  const rule = TRIAGE_REASONS.find(r => r.key === reasonKey);
  if (!rule) {
    // Unknown key → GP fallback
    return { doctorType: 'gp', specialty: 'General Practitioner', routingNote: 'A General Practitioner will assess your condition.' };
  }
  return {
    doctorType: rule.doctorType,
    specialty: rule.specialty,
    routingNote: rule.routingNote,
  };
}

/** Map specialty name → fee settings key */
export const SPECIALTY_FEE_KEYS = {
  'General Practitioner': 'fee_gp',
  'Psychiatrist':         'fee_psychiatrist',
  'Dermatologist':        'fee_dermatologist',
  'Cardiologist':         'fee_cardiologist',
  'Internal Medicine':    'fee_internal_medicine',
  'Pediatrician':         'fee_pediatrician',
  'Gynecologist':         'fee_gynecologist',
  'Pulmonologist':        'fee_pulmonologist',
  'Neurologist':          'fee_neurologist',
  'Orthopedic':           'fee_orthopedic',
};
