const CreateUserUseCase = require('../../application/use-cases/CreateUserUseCase');
const LoginUserUseCase = require('../../application/use-cases/LoginUserUseCase');
const { UserDTO } = require('../../application/dtos/UserDTO');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const AchievementService = require('../../infrastructure/services/AchievementService');

const MAX_AVATAR_DATA_URL_LENGTH = 4 * 1024 * 1024;

class AuthController {
  constructor() {
    this.userRepository = new UserRepository();
    this.achievementService = new AchievementService();
    this.createUserUseCase = new CreateUserUseCase(this.userRepository);
    this.loginUserUseCase = new LoginUserUseCase(this.userRepository);
  }

  _syncAchievements(userId) {
    return this.achievementService.syncUserAchievements(userId).catch((err) => {
      console.warn('[Achievements] sync failed:', err?.message || err);
      return [];
    });
  }

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: "password123"
   *               firstName:
   *                 type: string
   *                 example: "John"
   *               lastName:
   *                 type: string
   *                 example: "Doe"
   *               phoneNumber:
   *                 type: string
   *                 example: "+905551234567"
   *               dateOfBirth:
   *                 type: string
   *                 format: date
   *                 example: "1990-01-01"
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async register(req, res, next) {
    try {
      console.log('Register request received:', req.body);
      const userData = req.body;
      const result = await this.createUserUseCase.execute(userData);
      
      console.log('User created successfully:', result);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result
      });
    } catch (error) {
      console.error('Register error:', error);
      console.error('Error stack:', error.stack);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     description: Authenticate user and return JWT token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 example: "password123"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                     token:
   *                       type: string
   *       401:
   *         description: Invalid credentials
   *       500:
   *         description: Internal server error
   */
  async login(req, res, next) {
    try {
      const loginData = req.body;
      const result = await this.loginUserUseCase.execute(loginData);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: UserDTO.fromEntity(user)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Profil fotoğrafı: data URL (data:image/jpeg;base64,...) veya kaldırmak için null.
   */
  async updateProfileAvatar(req, res, next) {
    try {
      const userId = req.user.id;
      const { avatarDataUrl } = req.body;

      if (avatarDataUrl === undefined) {
        return res.status(400).json({
          success: false,
          message: 'avatarDataUrl alanı gerekli (string veya null).'
        });
      }

      if (avatarDataUrl !== null) {
        if (typeof avatarDataUrl !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'avatarDataUrl metin olmalıdır.'
          });
        }
        if (!avatarDataUrl.startsWith('data:image/')) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz görsel formatı. data:image/...;base64,... bekleniyor.'
          });
        }
        if (avatarDataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
          return res.status(400).json({
            success: false,
            message: 'Görsel çok büyük. Daha küçük bir fotoğraf seçin.'
          });
        }
      }

      const updated = await this.userRepository.update(userId, {
        avatar_data_url: avatarDataUrl
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profil fotoğrafı güncellendi.',
        data: UserDTO.fromEntity(updated)
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserDetails(req, res, next) {
    try {
      const userId = req.user.id;
      console.log('Getting user details for userId:', userId);
      const userDetails = await this.userRepository.getUserDetails(userId);
      const user = await this.userRepository.findById(userId);
      const uDto = UserDTO.fromEntity(user);
      console.log('User details from database:', userDetails);

      res.status(200).json({
        success: true,
        data: {
          ...(userDetails || {}),
          membershipTier: uDto.membershipTier,
          proExpiresAt: uDto.proExpiresAt,
          isPro: uDto.isPro,
        },
      });
    } catch (error) {
      console.error('Error getting user details:', error);
      next(error);
    }
  }

  /**
   * Pro üyelik (demo): aylık 100 ₺ — gerçek ödeme entegrasyonu yok; süreyi 30 gün uzatır.
   */
  async subscribePro(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await this.userRepository.activateProSubscription(userId, 30);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
      }
      const newlyUnlocked = await this._syncAchievements(userId);
      res.status(200).json({
        success: true,
        message: 'Pro üyeliğiniz 30 gün için etkinleştirildi. (Demo ödeme)',
        data: UserDTO.fromEntity(updated),
        newlyUnlocked: Array.isArray(newlyUnlocked) ? newlyUnlocked : [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pro üyeliği iptal (demo): ücretsiz plana döner; Form Puanla vb. Pro özellikleri kapanır.
   */
  async cancelProSubscription(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await this.userRepository.cancelProSubscription(userId);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
      }
      res.status(200).json({
        success: true,
        message: 'Pro üyeliğin iptal edildi. Ücretsiz plana döndün.',
        data: UserDTO.fromEntity(updated),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserDetails(req, res, next) {
    try {
      const userId = req.user.id;
      console.log('=== UPDATE USER DETAILS REQUEST ===');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('Request body keys:', Object.keys(req.body));
      
      const { height, weight, injuries, goal, gender, age } = req.body;
      
      console.log('Destructured values:', { 
        height, 
        weight, 
        injuries, 
        goal,
        gender,
        age,
        goalType: typeof goal,
        goalValue: goal,
        isGoalEmpty: !goal,
        isGoalNull: goal === null,
        isGoalUndefined: goal === undefined
      });
      
      // Validate goal if provided
      const validGoals = ['Kilo Alma', 'Kilo Verme', 'Kilo Koruma', 'Kas Geliştirme'];
      if (goal && !validGoals.includes(goal)) {
        console.log('Invalid goal value:', goal);
        return res.status(400).json({
          success: false,
          message: 'Invalid goal. Must be one of: Kilo Alma, Kilo Verme, Kilo Koruma, Kas Geliştirme'
        });
      }

      // Validate gender if provided
      const validGenders = ['Erkek', 'Kadın', 'Diğer'];
      if (gender && gender.trim() !== '' && !validGenders.includes(gender.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid gender. Must be one of: Erkek, Kadın, Diğer'
        });
      }

      // Validate age if provided (1-120)
      let ageNum = null;
      if (age !== undefined && age !== null && age !== '') {
        ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
          return res.status(400).json({
            success: false,
            message: 'Invalid age. Must be between 1 and 120'
          });
        }
      }
      
      const detailsToSave = {
        height: parseInt(height),
        weight: parseFloat(weight),
        injuries: injuries || [],
        goal: goal || null,
        gender: gender && gender.trim() ? gender.trim() : null,
        age: ageNum
      };
      
      console.log('Details to save to database:', detailsToSave);
      
      const userDetails = await this.userRepository.updateUserDetails(userId, detailsToSave);
      
      console.log('User details updated:', userDetails);
      console.log('=== END UPDATE ===');

      const newlyUnlocked = await this._syncAchievements(userId);

      res.status(200).json({
        success: true,
        message: 'User details updated successfully',
        data: userDetails,
        newlyUnlocked: Array.isArray(newlyUnlocked) ? newlyUnlocked : [],
      });
    } catch (error) {
      console.error('Error updating user details:', error);
      console.error('Error stack:', error.stack);
      next(error);
    }
  }
}

module.exports = AuthController;
