const express = require('express');
const AIController = require('../controllers/AIController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const aiController = new AIController();

// Tüm AI route'ları authentication gerektirir
router.use(authMiddleware);

// AI endpoints
router.post('/nutrition-question', aiController.answerQuestion.bind(aiController));
router.post('/nutrition-plan', aiController.generatePlan.bind(aiController));
router.post('/food-suggestions', aiController.suggestFoods.bind(aiController));
router.post('/exercise-program', aiController.generateExerciseProgram.bind(aiController));
router.post('/plate-analyze', aiController.analyzePlatePhoto.bind(aiController));
router.post('/form-score', aiController.analyzeFormScore.bind(aiController));

// Egzersiz programı: kaydet, listele, getir, güncelle, sil
router.post('/exercise-programs', aiController.saveExerciseProgram.bind(aiController));
router.get('/exercise-programs', aiController.getExercisePrograms.bind(aiController));
router.get('/exercise-programs/:id', aiController.getExerciseProgramById.bind(aiController));
router.put('/exercise-programs/:id', aiController.updateExerciseProgram.bind(aiController));
router.delete('/exercise-programs/:id', aiController.deleteExerciseProgram.bind(aiController));

// Haftalık beslenme planı: kaydet, listele, getir, güncelle, sil
router.post('/nutrition-plans', aiController.saveNutritionPlan.bind(aiController));
router.get('/nutrition-plans', aiController.getNutritionPlans.bind(aiController));
router.get('/nutrition-plans/:id', aiController.getNutritionPlanById.bind(aiController));
router.put('/nutrition-plans/:id', aiController.updateNutritionPlan.bind(aiController));
router.delete('/nutrition-plans/:id', aiController.deleteNutritionPlan.bind(aiController));

module.exports = router;

