-- ====================================================
-- FULL SQL SCHEMA: FOOD CALORIE AI WEB APP v2.0
-- Database Name: foodai
-- Cập nhật: Thêm bảng chat_history (AI Chatbot)
-- ====================================================

-- 1. Tạo và sử dụng Database
CREATE DATABASE IF NOT EXISTS foodai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE foodai;

-- Tắt kiểm tra khóa ngoại để xóa bảng dễ dàng
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa các bảng cũ nếu tồn tại
DROP TABLE IF EXISTS chat_history;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_goals;
DROP TABLE IF EXISTS exercise_logs;
DROP TABLE IF EXISTS nutrition_logs;
DROP TABLE IF EXISTS meal_details;
DROP TABLE IF EXISTS ai_predictions;
DROP TABLE IF EXISTS food_images;
DROP TABLE IF EXISTS meals;
DROP TABLE IF EXISTS foods;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- 2. TẠO CÁC BẢNG
-- ====================================================

-- Bảng người dùng
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng thông tin món ăn (Master data)
CREATE TABLE foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base_calories DECIMAL(8,2) NOT NULL,
    protein DECIMAL(8,2) DEFAULT 0,
    carbs DECIMAL(8,2) DEFAULT 0,
    fat DECIMAL(8,2) DEFAULT 0,
    fiber DECIMAL(8,2) DEFAULT 0,
    serving_size VARCHAR(50) DEFAULT '100g',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu ảnh do người dùng tải lên
CREATE TABLE food_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng lịch sử phân tích AI
CREATE TABLE ai_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT NOT NULL,
    predicted_food_id INT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES food_images(id) ON DELETE CASCADE,
    FOREIGN KEY (predicted_food_id) REFERENCES foods(id) ON DELETE SET NULL
);

-- Bảng danh sách các bữa ăn
CREATE TABLE meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    total_calories DECIMAL(8,2) DEFAULT 0,
    meal_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng chi tiết từng món trong bữa ăn
CREATE TABLE meal_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_id INT NOT NULL,
    food_id INT NOT NULL,
    ai_prediction_id INT NULL,
    quantity DECIMAL(8,2) DEFAULT 1.0,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    FOREIGN KEY (ai_prediction_id) REFERENCES ai_predictions(id) ON DELETE SET NULL
);

-- Bảng tổng hợp nhật ký dinh dưỡng theo từng ngày
CREATE TABLE nutrition_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein DECIMAL(8,2) DEFAULT 0,
    total_carbs DECIMAL(8,2) DEFAULT 0,
    total_fat DECIMAL(8,2) DEFAULT 0,
    UNIQUE KEY uq_user_date (user_id, log_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng lịch sử luyện tập
CREATE TABLE exercise_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exercise_name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned DECIMAL(8,2) NOT NULL,
    exercise_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng mục tiêu cá nhân
CREATE TABLE user_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_calories DECIMAL(8,2) NOT NULL,
    target_weight DECIMAL(5,2),
    current_weight DECIMAL(5,2),
    goal_type ENUM('lose_weight', 'maintain', 'gain_muscle') NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng thông báo hệ thống
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng lịch sử chat với AI tư vấn (MỚI v2.0)
CREATE TABLE chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sender ENUM('user', 'ai') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ====================================================
-- 3. DỮ LIỆU MẪU (SAMPLE DATA)
-- ====================================================

INSERT INTO foods (name, base_calories, protein, carbs, fat, fiber, serving_size) VALUES
('Phở Bò',        450.00, 25.00, 55.00, 12.00, 2.00, '1 bowl (400g)'),
('Pizza',          285.00, 12.00, 36.00, 10.00, 2.50, '1 slice (100g)'),
('Hamburger',      295.00, 17.00, 24.00, 14.00, 1.50, '1 burger (150g)'),
('Sushi',          200.00,  9.00, 38.00,  2.00, 1.00, '6 pieces (120g)'),
('Salad Gà',       150.00, 15.00, 10.00,  8.00, 5.00, '1 bowl (200g)'),
('Bún Bò Huế',     380.00, 22.00, 48.00, 10.00, 1.50, '1 bowl (380g)'),
('Cơm Sườn',       520.00, 28.00, 65.00, 16.00, 1.00, '1 plate (350g)'),
('Bánh Mì',        350.00, 18.00, 42.00, 11.00, 2.00, '1 sandwich (200g)'),
('Canh Chua',      120.00,  8.00, 15.00,  3.00, 3.00, '1 bowl (300g)'),
('Gà Nướng',       220.00, 30.00,  2.00,  9.00, 0.00, '1 piece (150g)');
