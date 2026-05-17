const db = require("../database/connection");


// --------------------------------------------------------
// EGZERSİZLERİ ÇEKME + HASTALIK FİLTRESİ
// --------------------------------------------------------
exports.fetchFilteredExercises = async (injuriesArray) => {
  const res = await db.query("SELECT * FROM exercises");
  let list = res.rows;

  if (!injuriesArray || injuriesArray.length === 0) return list;

  return list.filter((ex) => {
    if (!ex.disease_restriction) return true;
    const restricted = ex.disease_restriction.split(",").map((x) => x.trim());
    return !restricted.some((r) => injuriesArray.includes(r));
  });
};

// --------------------------------------------------------
// SPLIT TÜRÜ BELİRLEME
// --------------------------------------------------------
exports.determineSplitType = (days) => {
  if (days === 3) return "full_body";
  if (days === 4) return "upper_lower";
  if (days === 5) return "ppl_5";
  if (days === 6) return "ppl";
  return "full_body";
};

// --------------------------------------------------------
// PATTERN
// --------------------------------------------------------
const PATTERNS = {
  full_body: [
    ["Göğüs", "Sırt", "Bacak", "Omuz", "Core"],
    ["Göğüs", "Sırt", "Bacak", "Omuz", "Biceps"],
    ["Göğüs", "Sırt", "Bacak", "Omuz", "Triceps"],
  ],

  upper_lower: [
    ["Göğüs", "Sırt", "Omuz", "Biceps", "Triceps"],
    ["Bacak", "Core"],
    ["Göğüs", "Sırt", "Omuz", "Biceps", "Triceps"],
    ["Bacak", "Core"],
  ],

  ppl: [
    ["Göğüs", "Omuz", "Triceps"],
    ["Sırt", "Biceps"],
    ["Bacak", "Core"],
  ],

  ppl_5: [
    ["Göğüs", "Omuz", "Triceps"],
    ["Sırt", "Biceps"],
    ["Bacak", "Core"],
    ["Göğüs", "Sırt"],
    ["Bacak", "Omuz"],
  ],
};

// --------------------------------------------------------
// EGZERSİZ SEÇME
// --------------------------------------------------------
function pickExercises(exercises, groups, difficulty) {
  let selected = [];

  const count =
    difficulty === "advanced" ? 3 : difficulty === "intermediate" ? 2 : 1;

  groups.forEach((muscle) => {
    const available = exercises.filter((e) => e.muscle_group === muscle);
    if (available.length === 0) return;

    for (let i = 0; i < count; i++) {
      const pick = available[Math.floor(Math.random() * available.length)];
      selected.push(pick);
    }
  });

  return selected;
}

// --------------------------------------------------------
// PROGRAM OLUŞTURMA
// --------------------------------------------------------
exports.buildProgramStructure = (exercises, difficulty, days, splitType) => {
  const pattern = PATTERNS[splitType];
  let result = [];

  for (let i = 0; i < days; i++) {
    const groups = pattern[i % pattern.length];
    const dayExercises = pickExercises(exercises, groups, difficulty);

    result.push({
      label: `Gün ${i + 1}`,
      exercises: dayExercises,
    });
  }

  return result;
};

// --------------------------------------------------------
// VERİTABANINA PROGRAM KAYDETME
// --------------------------------------------------------
exports.saveProgramToDB = async (
  userId,
  difficulty,
  days,
  splitType,
  goal,
  structure
) => {
  const programRes = await db.query(
    `INSERT INTO training_programs (user_id, difficulty, days_per_week, split_type, goal)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [userId, difficulty, days, splitType, goal]
  );

  const programId = programRes.rows[0].id;

  for (let i = 0; i < structure.length; i++) {
    const day = structure[i];

    const dayRes = await db.query(
      `INSERT INTO training_program_days (program_id, day_index, day_label)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [programId, i + 1, day.label]
    );

    const dayId = dayRes.rows[0].id;

    for (let j = 0; j < day.exercises.length; j++) {
      const ex = day.exercises[j];

      await db.query(
        `INSERT INTO training_program_exercises 
           (program_day_id, exercise_id, order_index, sets, reps, rest_time, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          dayId,
          ex.id,
          j + 1,
          ex.sets,
          ex.reps,
          ex.rest_time,
          ex.notes,
        ]
      );
    }
  }

  return programId;
};
