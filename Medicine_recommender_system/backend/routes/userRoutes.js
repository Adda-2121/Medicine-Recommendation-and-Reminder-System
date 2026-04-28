const express = require('express');
const router = express.Router();
const { getUsers, createUser, verifyDoctor, getVerifiedDoctors, updateProfile, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const setupUploadStorage = require('../utils/upload');

const uploadProfile = setupUploadStorage('profiles');


router.route('/')
  .get(protect, authorize('company_admin'), getUsers)
  .post(protect, authorize('company_admin'), createUser);

router.route('/:id')
  .delete(protect, authorize('company_admin'), deleteUser);

router.put('/profile', protect, uploadProfile.single('profile_picture'), updateProfile);

router.get('/doctors', protect, getVerifiedDoctors);

router.put('/:id/verify', protect, authorize('company_admin'), verifyDoctor);

module.exports = router;
