const express = require('express');
const WorkoutController = require('../controllers/WorkoutController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const workoutController = new WorkoutController();

/**
 * @route   GET /api/workouts
 * @desc    Kullanıcının tüm workout planlarını getirir
 * @access  Private
 */
router.get('/', authMiddleware, workoutController.getUserWorkouts.bind(workoutController));

/**
 * @route   GET /api/workouts/:id
 * @desc    Belirli bir workout'un detaylarını (egzersizlerle birlikte) getirir
 * @access  Private
 */
router.get('/:id', authMiddleware, workoutController.getWorkoutDetails.bind(workoutController));

/**
 * @route   POST /api/workouts/assign
 * @desc    Kullanıcıya workout planı atar (plan → gün + exerciseId listesi)
 * @access  Private
 */
router.post('/assign', authMiddleware, workoutController.assignWorkouts.bind(workoutController));

/**
 * @route   DELETE /api/workouts/:id
 * @desc    Workout silme işlemi
 * @access  Private
 */
router.delete('/:id', authMiddleware, workoutController.deleteWorkout.bind(workoutController));

module.exports = router;
