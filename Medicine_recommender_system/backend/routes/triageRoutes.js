const express = require('express');
const router = express.Router();
const { getCategories, assignSpecialization } = require('../controllers/triageController');
const { protect } = require('../middlewares/authMiddleware');

// GET /api/triage/categories — public, no auth needed
router.get('/categories', getCategories);

// POST /api/triage/assign — protected, patient only
router.post('/assign', protect, assignSpecialization);

module.exports = router;
