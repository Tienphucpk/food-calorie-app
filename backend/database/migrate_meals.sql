-- Migration: Thêm cột food_name và notes vào bảng meals
-- Chạy file này trong MySQL nếu bảng meals đã tồn tại

USE foodai;

-- Thêm cột food_name (tên món AI nhận diện trực tiếp)
ALTER TABLE meals 
    ADD COLUMN IF NOT EXISTS food_name VARCHAR(255) NULL AFTER meal_date,
    ADD COLUMN IF NOT EXISTS notes VARCHAR(500) NULL AFTER food_name;

-- Kiểm tra kết quả
DESCRIBE meals;
