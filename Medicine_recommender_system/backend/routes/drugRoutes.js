const express = require('express');
const router = express.Router();
const drugController = require('../controllers/drugController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/search', drugController.searchDrugs);
router.get('/:id', drugController.getDrugDetails);

module.exports = router;
