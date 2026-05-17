const express = require('express');
const AuthController = require('../controllers/AuthController');
const AchievementController = require('../controllers/AchievementController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const authController = new AuthController();
const achievementController = new AchievementController();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));
router.put('/profile-avatar', authMiddleware, authController.updateProfileAvatar.bind(authController));
router.get('/user-details', authMiddleware, authController.getUserDetails.bind(authController));
router.put('/user-details', authMiddleware, authController.updateUserDetails.bind(authController));
// Daha spesifik yol önce (Express eşlemesi için)
router.post('/subscription/pro/cancel', authMiddleware, authController.cancelProSubscription.bind(authController));
router.post('/subscription/pro', authMiddleware, authController.subscribePro.bind(authController));
router.get('/achievements', authMiddleware, achievementController.getMyAchievements.bind(achievementController));

module.exports = router;
