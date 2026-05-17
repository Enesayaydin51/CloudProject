const {
  fetchFilteredExercises,
  determineSplitType,
  buildProgramStructure,
  saveProgramToDB
} = require("../../infrastructure/services/trainingProgramService");


exports.generateProgram = async (req, res) => {
  const userId = req.user.id; // JWT userId
  const { difficulty, daysPerWeek, userProfile } = req.body;

  try {
    // 1) Egzersizleri al
    const exercises = await fetchFilteredExercises(
      userProfile?.injuries || []
    );

    // 2) Split belirle
    const splitType = determineSplitType(daysPerWeek);

    // 3) Program yapısını oluştur
    const programStructure = buildProgramStructure(
      exercises,
      difficulty,
      daysPerWeek,
      splitType
    );

    // 4) PROGRAMI VERİTABANINA KAYDET 🔥🔥🔥
    const programId = await saveProgramToDB(
      userId,
      difficulty,
      daysPerWeek,
      splitType,
      userProfile?.goal || null,
      programStructure
    );

    // 5) Başarılı yanıt dön
    return res.json({
      success: true,
      programId,
      message: "Program başarıyla oluşturuldu."
    });

  } catch (error) {
    console.error("Program oluşturma hatası:", error);
    res.status(500).json({ message: "Program oluşturulamadı." });
  }
};





const db = require("../../infrastructure/database/connection");

exports.getUserProgram = async (req, res) => {
  try {
    const userId = req.user.id; // JWT'den gelen userId

    // Son programı çek
    const programRes = await db.query(
      `SELECT * FROM training_programs 
       WHERE user_id = $1 
       ORDER BY id DESC 
       LIMIT 1`,
      [userId]
    );

    if (programRes.rowCount === 0) {
      return res.json({ program: null });
    }

    const program = programRes.rows[0];

    // Günleri çek
    const daysRes = await db.query(
      `SELECT * FROM training_program_days 
       WHERE program_id = $1 
       ORDER BY day_index ASC`,
      [program.id]
    );

    const days = daysRes.rows;

    // Egzersizleri çek
    for (let day of days) {
      const exRes = await db.query(
        `SELECT e.*, tpe.order_index, tpe.sets, tpe.reps, tpe.rest_time, tpe.notes
         FROM training_program_exercises tpe
         JOIN exercises e ON e.id = tpe.exercise_id
         WHERE tpe.program_day_id = $1
         ORDER BY tpe.order_index ASC`,
        [day.id]
      );

      day.exercises = exRes.rows;
    }

    return res.json({
      program: {
        ...program,
        days,
      },
    });

  } catch (err) {
    console.error("Program getirme hatası:", err);
    res.status(500).json({ message: "Program getirilemedi." });
  }
};

