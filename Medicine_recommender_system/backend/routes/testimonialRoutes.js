const express = require('express');
const router = express.Router();
const { submitTestimonial, getProviderTestimonials, getMyTestimonials } = require('../controllers/testimonialController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, submitTestimonial);
router.get('/my', protect, getMyTestimonials);
router.get('/provider/:provider_id', getProviderTestimonials); // Publicly accessible

module.exports = router;
