const express = require('express');
const router = express.Router();
const { addAvailability, getAvailabilities, deleteAvailability } = require('../controllers/availabilityController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, authorize('doctor'), addAvailability)
  .get(protect, getAvailabilities);

router.route('/:id')
  .delete(protect, authorize('doctor'), deleteAvailability);

module.exports = router;
