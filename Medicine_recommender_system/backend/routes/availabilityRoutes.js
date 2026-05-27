const express = require('express');
const router = express.Router();
const { addAvailability, getAvailabilities, deleteAvailability } = require('../controllers/availabilityController');
const { protect, authorize, verifiedProfessional } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, authorize('doctor'), verifiedProfessional, addAvailability)
  .get(protect, getAvailabilities);

router.route('/:id')
  .delete(protect, authorize('doctor'), verifiedProfessional, deleteAvailability);

module.exports = router;
