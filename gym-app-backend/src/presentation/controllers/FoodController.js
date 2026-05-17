const GetFoodsUseCase = require('../../application/use-cases/GetFoodsUseCase');
const GetFoodByIdUseCase = require('../../application/use-cases/GetFoodByIdUseCase');
const FoodRepository = require('../../infrastructure/repositories/FoodRepository');
const { CreateFoodDTO, FoodDTO } = require('../../application/dtos/FoodDTO');
const Food = require('../../domain/entities/Food');

class FoodController {
  constructor() {
    this.foodRepository = new FoodRepository();
    this.getFoodsUseCase = new GetFoodsUseCase(this.foodRepository);
    this.getFoodByIdUseCase = new GetFoodByIdUseCase(this.foodRepository);
  }

  /**
   * @swagger
   * /api/foods:
   *   get:
   *     summary: Get all foods
   *     description: Retrieve all foods or search by name
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search foods by name
   *     responses:
   *       200:
   *         description: List of foods
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   */
  async getFoods(req, res, next) {
    try {
      const searchQuery = req.query.search || null;
      const foods = await this.getFoodsUseCase.execute(searchQuery);
      
      res.status(200).json({
        success: true,
        data: foods
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/foods/{id}:
   *   get:
   *     summary: Get food by ID
   *     description: Retrieve a specific food by its ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Food ID
   *     responses:
   *       200:
   *         description: Food details
   *       404:
   *         description: Food not found
   */
  async getFoodById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const food = await this.getFoodByIdUseCase.execute(id);
      
      res.status(200).json({
        success: true,
        data: food
      });
    } catch (error) {
      if (error.message === 'Food not found') {
        return res.status(404).json({
          success: false,
          message: 'Food not found'
        });
      }
      next(error);
    }
  }
}

module.exports = FoodController;

