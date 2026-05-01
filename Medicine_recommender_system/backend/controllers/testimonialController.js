const { Testimonial, Consultation, User } = require('../models');

// @desc    Submit a new testimonial
// @route   POST /api/testimonials
// @access  Private (Patient)
exports.submitTestimonial = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can submit testimonials' });
    }

    const { service_id, service_type, rating, comment } = req.body;

    if (!service_id || !service_type || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify service exists and is completed, and belongs to patient
    let provider_id = null;

    if (service_type === 'consultation') {
      const consultation = await Consultation.findOne({ where: { id: service_id, patient_id: req.user.id } });
      if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
      if (consultation.status !== 'completed') return res.status(400).json({ message: 'Service must be completed before leaving feedback' });
      provider_id = consultation.doctor_id;
    } else {
      return res.status(400).json({ message: 'Feedback can only be submitted for doctor consultations' });
    }

    if (!provider_id) {
      return res.status(400).json({ message: 'No provider assigned to this service' });
    }

    // Check if testimonial already exists
    const existing = await Testimonial.findOne({
      where: { patient_id: req.user.id, service_id }
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a testimonial for this service' });
    }

    // Create testimonial
    const testimonial = await Testimonial.create({
      patient_id: req.user.id,
      provider_id,
      service_id,
      service_type,
      rating,
      comment
    });

    return res.status(201).json({ message: 'Testimonial submitted successfully', testimonial });
  } catch (error) {
    console.error('Submit Testimonial Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get testimonials for a specific provider
// @route   GET /api/testimonials/provider/:provider_id
// @access  Public
exports.getProviderTestimonials = async (req, res) => {
  try {
    const { provider_id } = req.params;

    const testimonials = await Testimonial.findAll({
      where: { provider_id },
      include: [
        { model: User, as: 'Patient', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate average rating
    const total = testimonials.length;
    const sum = testimonials.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = total > 0 ? (sum / total).toFixed(1) : 0;

    return res.status(200).json({
      averageRating: Number(averageRating),
      totalReviews: total,
      testimonials
    });
  } catch (error) {
    console.error('Get Provider Testimonials Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get authenticated patient's testimonials
// @route   GET /api/testimonials/my
// @access  Private (Patient)
exports.getMyTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({
      where: { patient_id: req.user.id },
      include: [
        { model: User, as: 'Provider', attributes: ['id', 'name', 'role'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(testimonials);
  } catch (error) {
    console.error('Get My Testimonials Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
