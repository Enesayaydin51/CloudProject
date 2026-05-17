const AIService = require('../../infrastructure/services/AIService');
const AchievementService = require('../../infrastructure/services/AchievementService');
const { awardExerciseCompletionXp } = require('../../infrastructure/services/ExerciseCompletionXpService');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const UserXpRepository = require('../../infrastructure/repositories/UserXpRepository');
const { UserDTO } = require('../../application/dtos/UserDTO');
const NutritionPlanRepository = require('../../infrastructure/repositories/NutritionPlanRepository');
const AIExerciseProgramRepository = require('../../infrastructure/repositories/AIExerciseProgramRepository');

function defaultExerciseProgramCompletion() {
  return {
    days: {},
    weeks: { '1': false, '2': false, '3': false, '4': false },
    month: false,
  };
}

function isValidExerciseProgramPayload(program) {
  if (!program || typeof program !== 'object') return false;
  if (Array.isArray(program.weeks) && program.weeks.length > 0) return true;
  if (program.weeklySchedule && typeof program.weeklySchedule === 'object') return true;
  return false;
}

class AIController {
  constructor() {
    this.aiService = new AIService();
    this.achievementService = new AchievementService();
    this.userRepository = new UserRepository();
    this.nutritionPlanRepository = new NutritionPlanRepository();
    this.exerciseProgramRepository = new AIExerciseProgramRepository();
    this.userXpRepository = new UserXpRepository();
  }

  _syncAchievements(userId) {
    return this.achievementService.syncUserAchievements(userId).catch((err) => {
      console.warn('[Achievements] sync failed:', err?.message || err);
      return [];
    });
  }

  /**
   * @swagger
   * /api/ai/nutrition-question:
   *   post:
   *     summary: AI ile beslenme sorusu sor
   *     description: Kullanıcının beslenme sorusuna AI ile cevap verir
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - question
   *             properties:
   *               question:
   *                 type: string
   *                 example: "Günde kaç kalori almalıyım?"
   *     responses:
   *       200:
   *         description: AI cevabı
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  async answerQuestion(req, res, next) {
    try {
      const { question } = req.body;
      const userId = req.user.id;

      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Soru gereklidir',
        });
      }

      // Kullanıcı bilgilerini al
      const user = await this.userRepository.findById(userId);
      const userDetails = await this.userRepository.getUserDetails(userId);

      const userContext = {
        goal: userDetails?.goal || null,
        height: userDetails?.height || null,
        weight: userDetails?.weight || null,
        injuries: userDetails?.injuries || [],
        gender: userDetails?.gender || null,
        age: userDetails?.age ?? null,
      };

      const answer = await this.aiService.answerNutritionQuestion(question, userContext);

      res.status(200).json({
        success: true,
        data: {
          question,
          answer,
        },
      });
    } catch (error) {
      console.error('AI question error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/nutrition-plan:
   *   post:
   *     summary: AI ile kişiselleştirilmiş haftalık beslenme planı oluştur
   *     description: "Kullanıcı bilgilerine göre 7 günlük beslenme planı oluşturur. Format summary, week (Pazartesi vb. günler)."
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Haftalık beslenme planı (JSON)
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  async generatePlan(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await this.userRepository.findById(userId);
      if (!user || !UserDTO.isProActive(user)) {
        const weeklyCount = await this.nutritionPlanRepository.countThisWeekByUserId(userId);
        if (weeklyCount >= 2) {
          return res.status(403).json({
            success: false,
            code: 'PRO_REQUIRED',
            message: 'Bu özelliği daha fazla kullanmak için Pro plana geçmelisiniz.',
          });
        }
      }

      const userDetails = await this.userRepository.getUserDetails(userId);

      const userContext = {
        goal: userDetails?.goal || 'Kilo Koruma',
        height: userDetails?.height || 175,
        weight: userDetails?.weight || 70,
        injuries: userDetails?.injuries || [],
        gender: userDetails?.gender || null,
        age: userDetails?.age ?? null,
      };

      const plan = await this.aiService.generateNutritionPlan(userContext);

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      console.error('AI plan generation error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/nutrition-plans:
   *   post:
   *     summary: Beslenme planını kaydet
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [plan]
   *             properties:
   *               plan: { type: object, description: "Haftalık plan: { summary, week }" }
   *               planName: { type: string }
   *     responses:
   *       201:
   *         description: Plan kaydedildi
   *       400:
   *         description: Geçersiz plan
   */
  async saveNutritionPlan(req, res, next) {
    try {
      const userId = req.user.id;
      const { plan, planName } = req.body;

      if (!plan || !plan.week || !plan.summary) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz plan. plan.summary ve plan.week gönderilmeli (haftalık format).',
        });
      }

      const saved = await this.nutritionPlanRepository.create(userId, plan, planName || 'Haftalık Beslenme Planı');

      const newlyUnlocked = await this._syncAchievements(userId);

      res.status(201).json({
        success: true,
        message: 'Beslenme planı kaydedildi',
        data: {
          id: saved.id,
          planName: saved.planName,
          planData: saved.planData,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
          newlyUnlocked: Array.isArray(newlyUnlocked) ? newlyUnlocked : [],
        },
      });
    } catch (error) {
      console.error('Save nutrition plan error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/nutrition-plans:
   *   get:
   *     summary: Kullanıcının kayıtlı beslenme planlarını listele
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: offset
   *         schema: { type: integer, default: 0 }
   *     responses:
   *       200:
   *         description: Plan listesi
   */
  async getNutritionPlans(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
      const offset = parseInt(req.query.offset, 10) || 0;

      const plans = await this.nutritionPlanRepository.findByUserId(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      console.error('Get nutrition plans error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/nutrition-plans/{id}:
   *   get:
   *     summary: ID ile beslenme planı getir
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Plan detayı
   *       404:
   *         description: Plan bulunamadı
   */
  async getNutritionPlanById(req, res, next) {
    try {
      const userId = req.user.id;
      const planId = parseInt(req.params.id, 10);

      const plan = await this.nutritionPlanRepository.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Beslenme planı bulunamadı',
        });
      }
      if (plan.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu plana erişim yetkiniz yok',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: plan.id,
          planName: plan.planName,
          planData: plan.planData,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        },
      });
    } catch (error) {
      console.error('Get nutrition plan by id error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/nutrition-plans/{id}:
   *   put:
   *     summary: Beslenme planını güncelle (düzenle)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               plan: { type: object }
   *               planName: { type: string }
   *     responses:
   *       200:
   *         description: Plan güncellendi
   *       404:
   *         description: Plan bulunamadı
   */
  async updateNutritionPlan(req, res, next) {
    try {
      const userId = req.user.id;
      const planId = parseInt(req.params.id, 10);
      const { plan, planName } = req.body;

      const existing = await this.nutritionPlanRepository.findById(planId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Beslenme planı bulunamadı',
        });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu planı düzenleme yetkiniz yok',
        });
      }

      if (!plan || !plan.week || !plan.summary) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz plan. plan.summary ve plan.week gönderilmeli.',
        });
      }

      const updated = await this.nutritionPlanRepository.update(planId, plan, planName ?? existing.planName);

      const newlyUnlocked = await this._syncAchievements(userId);

      res.status(200).json({
        success: true,
        message: 'Beslenme planı güncellendi',
        data: {
          id: updated.id,
          planName: updated.planName,
          planData: updated.planData,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          newlyUnlocked: Array.isArray(newlyUnlocked) ? newlyUnlocked : [],
        },
      });
    } catch (error) {
      console.error('Update nutrition plan error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/nutrition-plans/{id}:
   *   delete:
   *     summary: Beslenme planını sil
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Plan silindi
   *       404:
   *         description: Plan bulunamadı
   */
  async deleteNutritionPlan(req, res, next) {
    try {
      const userId = req.user.id;
      const planId = parseInt(req.params.id, 10);

      const existing = await this.nutritionPlanRepository.findById(planId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Beslenme planı bulunamadı',
        });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu planı silme yetkiniz yok',
        });
      }

      await this.nutritionPlanRepository.delete(planId);

      res.status(200).json({
        success: true,
        message: 'Beslenme planı silindi',
      });
    } catch (error) {
      console.error('Delete nutrition plan error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/food-suggestions:
   *   post:
   *     summary: AI ile yemek önerileri al
   *     description: Kriterlere göre yemek önerileri getirir
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - criteria
   *             properties:
   *               criteria:
   *                 type: string
   *                 example: "yüksek protein, düşük kalori"
   *     responses:
   *       200:
   *         description: Yemek önerileri listesi
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  async suggestFoods(req, res, next) {
    try {
      const { criteria } = req.body;
      const userId = req.user.id;

      if (!criteria || criteria.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Kriter gereklidir',
        });
      }

      // Kullanıcı bilgilerini al
      const userDetails = await this.userRepository.getUserDetails(userId);

      const userContext = {
        goal: userDetails?.goal || null,
        injuries: userDetails?.injuries || [],
        gender: userDetails?.gender || null,
        age: userDetails?.age ?? null,
      };

      const foods = await this.aiService.suggestFoods(criteria, userContext);

      res.status(200).json({
        success: true,
        data: {
          criteria,
          foods,
        },
      });
    } catch (error) {
      console.error('AI food suggestions error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/ai/exercise-program:
   *   post:
   *     summary: AI ile kişiselleştirilmiş egzersiz programı oluştur
   *     description: Kullanıcı bilgilerine göre özel egzersiz programı oluşturur
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               difficulty:
   *                 type: string
   *                 example: "beginner"
   *               daysPerWeek:
   *                 type: number
   *                 example: 3
   *     responses:
   *       200:
   *         description: Egzersiz programı
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  async generateExerciseProgram(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await this.userRepository.findById(userId);
      if (!user || !UserDTO.isProActive(user)) {
        const weeklyCount = await this.exerciseProgramRepository.countThisWeekByUserId(userId);
        if (weeklyCount >= 1) {
          return res.status(403).json({
            success: false,
            code: 'PRO_REQUIRED',
            message: 'Bu özelliği daha fazla kullanmak için Pro plana geçmelisiniz.',
          });
        }
      }

      const {
        difficulty = 'beginner',
        daysPerWeek = 3,
        survey = {},
        programName: bodyProgramName,
      } = req.body;

      const resolvedProgramName =
        typeof bodyProgramName === 'string' && bodyProgramName.trim().length > 0
          ? bodyProgramName.trim().slice(0, 120)
          : `AI Program - ${difficulty}`;

      const userDetails = await this.userRepository.getUserDetails(userId);

      const userContext = {
        height: userDetails?.height || null,
        weight: userDetails?.weight || null,
        age: userDetails?.age ?? (userDetails?.dateOfBirth 
          ? new Date().getFullYear() - new Date(userDetails.dateOfBirth).getFullYear()
          : null),
        goal: userDetails?.goal || 'Genel Fitness',
        injuries: userDetails?.injuries || [],
        gender: userDetails?.gender || null,
      };

      const programConfig = {
        difficulty,
        daysPerWeek,
        survey: {
          place: survey.place || null,
          equipment: survey.equipment || null,
          focus: survey.focus || null,
          duration: survey.duration || null,
          focusMuscle: survey.focusMuscle || null,  // Opsiyonel: öncelik verilecek kas bölgesi
        },
      };

      const program = await this.aiService.generateExerciseProgram(userContext, programConfig);

      const programToSave = {
        ...program,
        completion:
          program.completion && typeof program.completion === 'object'
            ? { ...defaultExerciseProgramCompletion(), ...program.completion }
            : defaultExerciseProgramCompletion(),
      };

      const savedProgram = await this.exerciseProgramRepository.create(
        userId,
        programToSave,
        resolvedProgramName
      );

      const xpGranted = await awardExerciseCompletionXp(
        userId,
        savedProgram.id,
        null,
        programToSave,
        this.userXpRepository
      );

      const newlyUnlocked = await this._syncAchievements(userId);

      res.status(200).json({
        success: true,
        data: {
          id: savedProgram.id,
          program: savedProgram.programData,
          programName: savedProgram.programName,
          newlyUnlocked: Array.isArray(newlyUnlocked) ? newlyUnlocked : [],
          xpGranted,
        },
      });
    } catch (error) {
      console.error('AI exercise program generation error:', error);
      next(error);
    }
  }

  /**
   * Egzersiz programını kaydet (manuel kaydet / farklı kaydet)
   */
  async saveExerciseProgram(req, res, next) {
    try {
      const userId = req.user.id;
      const { program, programName } = req.body;

      if (!isValidExerciseProgramPayload(program)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz program. program.weeks veya program.weeklySchedule gönderilmeli.',
        });
      }

      const saved = await this.exerciseProgramRepository.create(
        userId,
        program,
        programName || 'Egzersiz Programı'
      );

      const xpGranted = await awardExerciseCompletionXp(
        userId,
        saved.id,
        null,
        program,
        this.userXpRepository
      );

      const newlyUnlocked = await this._syncAchievements(userId);

      res.status(201).json({
        success: true,
        message: 'Egzersiz programı kaydedildi',
        data: {
          id: saved.id,
          programName: saved.programName,
          programData: saved.programData,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
          newlyUnlocked: Array.isArray(newlyUnlocked) ? newlyUnlocked : [],
          xpGranted,
        },
      });
    } catch (error) {
      console.error('Save exercise program error:', error);
      next(error);
    }
  }

  /**
   * Kullanıcının kayıtlı egzersiz programlarını listele
   */
  async getExercisePrograms(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
      const offset = parseInt(req.query.offset, 10) || 0;

      const programs = await this.exerciseProgramRepository.findByUserId(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: programs,
      });
    } catch (error) {
      console.error('Get exercise programs error:', error);
      next(error);
    }
  }

  /**
   * ID ile egzersiz programı getir
   */
  async getExerciseProgramById(req, res, next) {
    try {
      const userId = req.user.id;
      const programId = parseInt(req.params.id, 10);

      const plan = await this.exerciseProgramRepository.findById(programId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Egzersiz programı bulunamadı',
        });
      }
      if (plan.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu programa erişim yetkiniz yok',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: plan.id,
          programName: plan.programName,
          programData: plan.programData,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        },
      });
    } catch (error) {
      console.error('Get exercise program by id error:', error);
      next(error);
    }
  }

  /**
   * Egzersiz programını güncelle
   */
  async updateExerciseProgram(req, res, next) {
    try {
      const userId = req.user.id;
      const programId = parseInt(req.params.id, 10);
      const { program, programName } = req.body;

      const existing = await this.exerciseProgramRepository.findById(programId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Egzersiz programı bulunamadı',
        });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu programı düzenleme yetkiniz yok',
        });
      }

      if (!isValidExerciseProgramPayload(program)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz program. program.weeks veya program.weeklySchedule gönderilmeli.',
        });
      }

      const xpGranted = await awardExerciseCompletionXp(
        userId,
        programId,
        existing.programData,
        program,
        this.userXpRepository
      );

      const updated = await this.exerciseProgramRepository.update(
        programId,
        program,
        programName ?? existing.programName
      );

      const newlyUnlocked = await this._syncAchievements(userId);

      res.status(200).json({
        success: true,
        message: 'Egzersiz programı güncellendi',
        data: {
          id: updated.id,
          programName: updated.programName,
          programData: updated.programData,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          newlyUnlocked: Array.isArray(newlyUnlocked) ? newlyUnlocked : [],
          xpGranted,
        },
      });
    } catch (error) {
      console.error('Update exercise program error:', error);
      next(error);
    }
  }

  /**
   * Egzersiz programını sil
   */
  async deleteExerciseProgram(req, res, next) {
    try {
      const userId = req.user.id;
      const programId = parseInt(req.params.id, 10);

      const existing = await this.exerciseProgramRepository.findById(programId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Egzersiz programı bulunamadı',
        });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu programı silme yetkiniz yok',
        });
      }

      await this.exerciseProgramRepository.delete(programId);

      res.status(200).json({
        success: true,
        message: 'Egzersiz programı silindi',
      });
    } catch (error) {
      console.error('Delete exercise program error:', error);
      next(error);
    }
  }

  /**
   * Tabak fotoğrafı ile besin analizi:
   * Body: { imageBase64: string, mimeType?: string, portion?: 'az'|'orta'|'çok' }
   * Çıktı: calories + macros + micros (yaklaşık)
   */
  async analyzePlatePhoto(req, res, next) {
    try {
      const user = await this.userRepository.findById(req.user.id);
      if (!user || !UserDTO.isProActive(user)) {
        return res.status(403).json({
          success: false,
          code: 'PRO_REQUIRED',
          message:
            'Tabak fotoğrafı ile besin analizi yalnızca Pro üyeler içindir. Profilden Pro’ya yükseltebilirsiniz.',
        });
      }

      const {
        imageBase64,
        mimeType = 'image/jpeg',
        portion = 'orta',
      } = req.body || {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'imageBase64 verisi gereklidir.',
        });
      }

      const imageBuffer = Buffer.from(imageBase64, 'base64');
      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz resim verisi.',
        });
      }

      // OOM önlemi: base64 boyutu çok büyüyebilir.
      const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
      if (imageBuffer.length > MAX_IMAGE_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'Resim çok büyük. 8 MB altında bir fotoğraf yükleyin.',
        });
      }

      const prompt = `Sen bir diyetisyen ve beslenme uzmanısın. Kullanıcının tabak fotoğrafına göre yemekteki besinleri tahmin et ve yaklaşık beslenme değerlerini çıkar.

Kullanıcının tahmini porsiyonu: ${portion}

ZORUNLU KURALLAR:
1. Çıktı SADECE aşağıdaki JSON olmalı. JSON dışı hiçbir metin yazma.
2. Değerleri yaklaşık hesapla. Belirsizse en makul tahmini yap.
3. carbs = toplam karbonhidrat (fiber dahil edilebilir), micros ise ek besin ögeleri.

JSON ŞEMA:
{
  "foodLabel": "string",
  "portion": "string",
  "confidence": 0-1,
  "nutrition": {
    "calories": number,
    "macros": {
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    },
    "micros": {
      "fiber_g": number|null,
      "sugar_g": number|null,
      "sodium_mg": number|null,
      "cholesterol_mg": number|null,
      "potassium_mg": number|null
    }
  }
}
`;

      const result = await this.aiService.analyzePlatePhoto(imageBuffer, mimeType, prompt);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('AI plate analyze error:', error);
      next(error);
    }
  }

  /**
   * Hareket formu puanlama: video yüklenir, AI formu 1-10 arası puanlar ve kriterlere göre geri bildirim verir.
   * Body: { videoBase64: string, mimeType?: string, exerciseName?: string }
   */
  async analyzeFormScore(req, res, next) {
    try {
      const user = await this.userRepository.findById(req.user.id);
      if (!user || !UserDTO.isProActive(user)) {
        return res.status(403).json({
          success: false,
          code: 'PRO_REQUIRED',
          message: 'AI ile video form analizi yalnızca Pro üyeler içindir. Profilden Pro’ya yükseltebilirsiniz.',
        });
      }

      const { videoBase64, mimeType = 'video/mp4', exerciseName } = req.body;
      if (!videoBase64 || typeof videoBase64 !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Video verisi (videoBase64) gereklidir.',
        });
      }
      const videoBuffer = Buffer.from(videoBase64, 'base64');
      if (videoBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz video verisi.',
        });
      }
      const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20 MB (OOM önlemi; telefon tarafı 15 MB ile sınırlı)
      if (videoBuffer.length > MAX_VIDEO_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'Video çok büyük. Bellek hatası olmaması için 15–20 MB altında kısa video (örn. 15–30 sn) yükleyin.',
        });
      }
      const exerciseHint = exerciseName && exerciseName.trim()
        ? ` Egzersiz: ${exerciseName.trim()}.`
        : '';
      const prompt = `Bu videodaki hareket formunu değerlendir.${exerciseHint}

Şu kriterlere göre 1-10 arası puan ver ve kısa cümlelerle açıkla:
• Hareket genişliği ve tam hareket (ROM): Hareket tam yapılıyor mu?
• Hız ve kontrol: Kontrollü ve uygun tempo var mı?
• Nefes: Nefes zamanlaması doğru mu?
• Hizalama ve duruş: Omurga, diz, dirsek hizası doğru mu?
• Güvenlik: Sakatlık riski oluşturacak bir hata var mı?

Çıktı formatı (Türkçe):
PUAN: X/10
Hareket genişliği: (kısa cümle)
Hız ve kontrol: (kısa cümle)
Nefes: (kısa cümle)
Hizalama: (kısa cümle)
Güvenlik: (kısa cümle)
Özet ve öneri: (2-3 cümle)`;

      const feedback = await this.aiService.analyzeVideo(videoBuffer, mimeType, prompt);
      res.status(200).json({
        success: true,
        data: { feedback },
      });
    } catch (error) {
      console.error('AI form score error:', error);
      next(error);
    }
  }
}

module.exports = AIController;

