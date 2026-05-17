const WorkoutRepository = require('../../infrastructure/repositories/WorkoutRepository');
const AssignWorkoutsUseCase = require('../../application/use-cases/AssignWorkoutsUseCase');

class WorkoutController {
  constructor() {
    this.workoutRepository = new WorkoutRepository();
    this.assignWorkoutsUseCase = new AssignWorkoutsUseCase(this.workoutRepository);
  }

  async getUserWorkouts(req, res, next) {
    try {
      const userId = req.user.id;
      const workouts = await this.workoutRepository.getWorkoutsByUserId(userId);

      res.status(200).json({
        success: true,
        data: workouts
      });
    } catch (error) {
      console.error('GetUserWorkouts error:', error);
      next(error);
    }
  }

  async getWorkoutDetails(req, res, next) {
    try {
      const workoutId = req.params.id;
      const workout = await this.workoutRepository.getWorkoutWithExercises(workoutId);

      if (!workout) {
        return res.status(404).json({
          success: false,
          message: 'Workout not found'
        });
      }

      res.status(200).json({
        success: true,
        data: workout
      });
    } catch (error) {
      console.error('GetWorkoutDetails error:', error);
      next(error);
    }
  }

  async assignWorkouts(req, res, next) {
    try {
      const userId = req.user.id;
      const { gymId, plan } = req.body;

      // ✅ Giriş doğrulama
      if (!gymId || !Array.isArray(plan) || plan.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request body. Expected gymId and non-empty plan array.'
        });
      }

      // Plan yapısında her günün formatı şu şekilde olmalı:
      // {
      //   "date": "2025-11-07",
      //   "startTime": "10:00",
      //   "endTime": "11:30",
      //   "notes": "Göğüs günü",
      //   "exercises": [
      //     { "exerciseId": 1, "sets": 4, "reps": "8-10", "duration": 60, "restTime": 90, "notes": "Ağır yük" },
      //     { "exerciseId": 2, "sets": 3, "reps": "10-12", "duration": 60, "restTime": 60 }
      //   ]
      // }

      const assigned = await this.assignWorkoutsUseCase.execute(userId, gymId, plan);

      res.status(201).json({
        success: true,
        message: 'Workouts assigned successfully',
        data: assigned
      });
    } catch (error) {
      console.error('AssignWorkouts error:', error);
      next(error);
    }
  }

  async deleteWorkout(req, res, next) {
    try {
      const workoutId = req.params.id;
      await this.workoutRepository.deleteWorkout(workoutId);

      res.status(200).json({
        success: true,
        message: 'Workout deleted successfully'
      });
    } catch (error) {
      console.error('DeleteWorkout error:', error);
      next(error);
    }
  }
}

module.exports = WorkoutController;
