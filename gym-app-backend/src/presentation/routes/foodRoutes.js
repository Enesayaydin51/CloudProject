const express = require('express');
const FoodController = require('../controllers/FoodController');

const router = express.Router();
const foodController = new FoodController();

// Public routes
router.get('/', foodController.getFoods.bind(foodController));
router.get('/:id', foodController.getFoodById.bind(foodController));

module.exports = router;

