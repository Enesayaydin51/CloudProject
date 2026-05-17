-- Initialize gym app database
-- This script creates the database and runs all migrations

-- Create database if it doesn't exist
-- Note: This needs to be run as a superuser or database owner
-- CREATE DATABASE gym_app;

-- Connect to the gym_app database
-- \c gym_app;

-- Run all migration files

INSERT INTO exercises (name, muscle_group, sub_target, equipment_type, sets, reps, duration, rest_time, notes, disease_restriction) VALUES
('Incline Barbell Press', 'Göğüs', 'Üst', 'Barbell', 4, '6-8', 60, 120, 'Ağır yük, kontrollü negatif.', 'yuksekTansiyon'),
('Flat Dumbbell Press', 'Göğüs', 'Orta', 'Dumbbell', 3, '8-10', 60, 90, 'Tam streç ve pompa.', 'yuksekTansiyon'),
('Machine Chest Press', 'Göğüs', 'Genel', 'Machine', 3, '12-15', 60, 75, 'Makine stabilizasyonu.', NULL),
('Pec Deck Fly', 'Göğüs', 'İzole', 'Machine', 3, '12-15', 60, 75, 'Hafif yük, tam kasılma.', NULL),
('Cable Fly', 'Göğüs', 'Alt', 'Cable', 3, '12-15', 60, 60, 'İzole streç ve kasılma.', NULL),
('Incline Dumbbell Press', 'Göğüs', 'Üst', 'Dumbbell', 3, '8-12', 60, 90, 'Barbell yerine Dumbbell.', 'yuksekTansiyon'),
('Dumbbell Fly', 'Göğüs', 'İzole', 'Dumbbell', 3, '15-20', 60, 45, 'Yüksek tekrar ve yanma.', NULL);


INSERT INTO exercises (name, muscle_group, sub_target, equipment_type, sets, reps, duration, rest_time, notes, disease_restriction) VALUES
('Seated Dumbbell Press', 'Omuz', 'Ön/Yan', 'Dumbbell', 3, '10-12', 60, 75, 'Omuz gücüne odaklan.', 'yuksekTansiyon'),
('Machine Shoulder Press', 'Omuz', 'Genel', 'Machine', 3, '12-15', 60, 75, 'Sırt desteği zorunlu.', NULL),
('Dumbbell Lateral Raise', 'Omuz', 'Yan', 'Dumbbell', 3, '12-15', 60, 60, 'Kontrollü hareket.', NULL),
('Cable Lateral Raise', 'Omuz', 'Yan', 'Cable', 3, '15-20', 60, 45, 'Yüksek tekrar yanma.', NULL),
('Face Pulls', 'Omuz', 'Arka', 'Cable', 3, '15-20', 60, 60, 'Rotasyon ve omuz sağlığı.', NULL),
('Dumbbell Front Raise', 'Omuz', 'Ön', 'Dumbbell', 3, '12-15', 60, 60, 'Hafif ağırlıkla.', NULL);


INSERT INTO exercises (name, muscle_group, sub_target, equipment_type, sets, reps, duration, rest_time, notes, disease_restriction) VALUES
('Barbell Row', 'Sırt', 'Kalınlık', 'Barbell', 3, '8-10', 60, 90, 'Kontrollü form.', 'belFitigi,yuksekTansiyon'),
('Lat Pulldown', 'Sırt', 'Genişlik', 'Cable', 3, '10-12', 60, 75, 'Çekişte sırtı kasmaya odaklan.', NULL),
('Narrow Grip Lat Pulldown', 'Sırt', 'Genişlik', 'Cable', 3, '12-15', 60, 75, 'Alt sırt bölgesine odaklan.', NULL),
('Single-Arm Dumbbell Row', 'Sırt', 'Tek Kol', 'Dumbbell', 3, '8-10', 60, 75, 'Streç pozisyonu.', 'belFitigi'),
('Chest Supported Row', 'Sırt', 'Kalınlık', 'Machine', 3, '10-12', 60, 90, 'Bel desteğiyle izole çalışma.', 'belFitigi'),
('Seated Cable Row', 'Sırt', 'Kalınlık', 'Cable', 3, '12-15', 60, 75, 'Kontrollü çekiş.', NULL);


INSERT INTO exercises (name, muscle_group, sub_target, equipment_type, sets, reps, duration, rest_time, notes, disease_restriction) VALUES
('Barbell Curl', 'Biceps', 'Genel', 'Barbell', 3, '8-10', 60, 60, 'Tepe kasılmasına odaklan.', 'yuksekTansiyon'),
('Hammer Curl', 'Biceps', 'Brachialis', 'Dumbbell', 3, '10-12', 60, 60, 'Ön kol ve kalınlık.', NULL),
('Incline Dumbbell Curl', 'Biceps', 'İzole', 'Dumbbell', 3, '10-12', 60, 60, 'Tam gerilme.', NULL),
('Cable Curl', 'Biceps', 'İzole', 'Cable', 3, '12-15', 60, 60, 'Hızlı geçiş.', NULL),
('Seated Dumbbell Curl', 'Biceps', 'Genel', 'Dumbbell', 3, '10-12', 60, 60, 'Oturarak denge sağla.', NULL);


INSERT INTO exercises (name, muscle_group, sub_target, equipment_type, sets, reps, duration, rest_time, notes, disease_restriction) VALUES
('Cable Overhead Extension', 'Triceps', 'Uzun Baş', 'Cable', 3, '10-12', 60, 60, 'Kolu başın arkasına uzat.', 'yuksekTansiyon'),
('Rope Triceps Pushdown', 'Triceps', 'Yan Baş', 'Cable', 3, '12-15', 60, 60, 'Yüksek tekrar ile bitir.', NULL),
('Dumbbell Skullcrusher', 'Triceps', 'Uzun Baş', 'Dumbbell', 3, '10-12', 60, 60, 'Tricepsi maksimum kasılma noktasına getir.', NULL);


INSERT INTO exercises (name, muscle_group, sub_target, equipment_type, sets, reps, duration, rest_time, notes, disease_restriction) VALUES
('Barbell Back Squat', 'Bacak', 'Kuadriseps', 'Barbell', 4, '6-8', 60, 150, 'Derin squat, patlayıcı kalkış.', 'belFitigi,dizSakatligi,yuksekTansiyon'),
('Leg Press', 'Bacak', 'Genel', 'Machine', 3, '10-12', 60, 90, 'Yüksek hacimli bileşik hareket.', 'dizSakatligi'),
('Leg Extension', 'Bacak', 'Kuadriseps', 'Machine', 3, '12-15', 60, 75, 'Tepe noktada sıkıştır.', 'dizSakatligi'),
('Lying Leg Curl', 'Bacak', 'Hamstring', 'Machine', 3, '10-12', 60, 75, 'Negatif tekrarlara odaklan.', 'dizSakatligi'),
('Hip Thrust', 'Bacak', 'Kalça', 'Barbell', 3, '8-12', 60, 90, 'Kalça kasılması.', 'belFitigi'),
('Standing Calf Raise', 'Bacak', 'Baldır', 'Machine', 4, '15-20', 60, 60, 'Tam esneme ve kasılma.', 'dizSakatligi'),
('Seated Calf Raise', 'Bacak', 'Baldır', 'Machine', 4, '12-15', 60, 60, 'Yavaş kontrollü tempo.', NULL);


INSERT INTO exercises (name, muscle_group, sub_target, equipment_type, sets, reps, duration, rest_time, notes, disease_restriction) VALUES
('Plank', 'Core', 'Stabilite', 'Bodyweight', 3, '60 sn', 60, 60, 'Omurga stabilizasyonu.', 'yuksekTansiyon'),
('Side Plank', 'Core', 'Yan', 'Bodyweight', 3, '45-60 sn', 60, 60, 'Yan core kuvveti.', 'yuksekTansiyon'),
('Hanging Leg Raise', 'Core', 'Alt', 'Bodyweight', 3, '12-15', 60, 60, 'Karın alt bölgesi.', 'belFitigi'),
('Cable Woodchopper', 'Core', 'Dinamik', 'Cable', 3, '12-15', 60, 60, 'Dinamik rotasyonel güç.', NULL),
('Bird Dog', 'Core', 'Denge', 'Bodyweight', 3, '10 (Her Taraf)', 60, 60, 'Denge ve merkez kontrolü.', NULL),
('Yürüyüş / Eliptik / Bisiklet', 'Kardiyo', 'Hafif', 'Machine', 1, '45-60 dk', 60, 0, 'Nabız kontrolü.', NULL),
('Tek Ayak Üzerinde Durma', 'Denge', 'Core', 'Bodyweight', 3, '30 sn (Her Ayak)', 60, 45, 'Dengeyi artırır.', NULL),
('Hafif Esneme', 'Mobilite', NULL, 'Bodyweight', 1, '5-10 dk', 60, 0, 'Antrenman sonrası esneme.', NULL);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gym_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gym_app_user;
