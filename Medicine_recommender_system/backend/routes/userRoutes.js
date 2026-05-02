const express = require('express');
const router = express.Router();
const { getUsers, createUser, verifyDoctor, getVerifiedDoctors, updateProfile, updateUser, deleteUser, toggleAvailability, getAvailabilityStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const setupUploadStorage = require('../utils/upload');

const uploadProfile = setupUploadStorage('profiles');


router.route('/')
  .get(protect, authorize('company_admin'), getUsers)
  .post(protect, authorize('company_admin'), createUser);

router.get('/availability', protect, authorize('doctor'), getAvailabilityStatus);
router.put('/availability', protect, authorize('doctor'), toggleAvailability);

router.put('/profile', protect, uploadProfile.single('profile_picture'), updateProfile);

router.get('/doctors', protect, getVerifiedDoctors);

router.route('/:id')
  .put(protect, authorize('company_admin'), updateUser)
  .delete(protect, authorize('company_admin'), deleteUser);

router.put('/:id/verify', protect, authorize('company_admin'), verifyDoctor);

module.exports = router;
