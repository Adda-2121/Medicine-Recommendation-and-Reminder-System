const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getSettings);

router.route('/:key')
  .put(protect, authorize('company_admin'), updateSetting);

module.exports = router;
