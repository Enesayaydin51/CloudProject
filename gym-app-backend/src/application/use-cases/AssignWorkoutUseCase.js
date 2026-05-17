const WorkoutRepository = require('../../infrastructure/repositories/WorkoutRepository');

class AssignWorkoutsUseCase {
  constructor(workoutRepository) {
    this.workoutRepository = workoutRepository;
  }

  async execute(userId, gymId, plan) {
    const assignedWorkouts = [];

    for (const day of plan) {
      
      const workout = await this.workoutRepository.createWorkout({
        userId,
        gymId,
        workoutDate: day.date,
        startTime: day.startTime || null,
        endTime: day.endTime || null,
        notes: day.notes || null
      });

      if (day.exercises && day.exercises.length > 0) {
        for (const ex of day.exercises) {
          await this.workoutRepository.addExerciseToWorkout(
            workout.id,
            ex.exerciseId,
            ex.sets,
            ex.reps,
            ex.duration,
            ex.restTime,
            ex.notes || null
          );
        }
      }

      assignedWorkouts.push(workout);
    }

    return assignedWorkouts;
  }
}

module.exports = AssignWorkoutsUseCase;
