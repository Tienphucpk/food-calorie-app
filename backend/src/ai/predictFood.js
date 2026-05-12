const axios = require('axios');
const fs = require('fs');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

const MOCK_FOODS = [
    { food_name: 'Pizza',       calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2.5 },
    { food_name: 'Hamburger',   calories: 295, protein: 17, carbs: 24, fat: 14, fiber: 1.5 },
    { food_name: 'Donuts',      calories: 452, protein: 5,  carbs: 51, fat: 25, fiber: 1.5 },
    { food_name: 'Ice Cream',   calories: 207, protein: 3.5,carbs: 24, fat: 11, fiber: 0.6 },
    { food_name: 'Pancakes',    calories: 227, protein: 5,  carbs: 40, fat: 6,  fiber: 1.0 },
];

const predictFoodFromImage = async (userId, imagePath) => {
    const AiModel = require('../models/AiModel');

    // 1. Lưu ảnh vào DB
    const imageId = await AiModel.saveImage(userId, imagePath);

    let result;

    try {
        // 2. Đọc ảnh → base64 → gửi JSON (không cần form-data package)
        const fileBuffer = fs.readFileSync(imagePath);
        const base64Image = fileBuffer.toString('base64');
        const mimeType = 'image/jpeg';

        const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
            image_base64: base64Image,
            mime_type: mimeType,
            filename: path.basename(imagePath)
        }, { timeout: 30000 });

        const d = response.data;

        // Python AI trả về nutrition lồng nhau: { nutrition: { calories, protein, ... } }
        const nutrition = d.nutrition || {};

        result = {
            food_name:     d.food_name,
            calories:      nutrition.calories  ?? d.calories  ?? 0,
            protein:       nutrition.protein   ?? d.protein   ?? 0,
            carbs:         nutrition.carbs     ?? d.carbs     ?? 0,
            fat:           nutrition.fat       ?? d.fat       ?? 0,
            fiber:         nutrition.fiber     ?? d.fiber     ?? 0,
            confidence:    d.confidence,
            model_version: d.model_version || d.model_info?.model || 'v2.0-vit'
        };
        console.log(`AI Predicted: ${result.food_name} | ${result.calories}kcal | conf: ${result.confidence}%`);


    } catch (err) {
        // 3. Fallback nếu Python service không chạy
        console.warn('AI service unavailable, using mock:', err.message);
        const mock = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
        result = {
            ...mock,
            confidence:    +(Math.random() * 14 + 85).toFixed(1),
            model_version: 'mock-fallback'
        };
    }

    // 4. Lưu prediction vào DB
    const predictionId = await AiModel.savePrediction(imageId, null, result.confidence, result.model_version);

    return { prediction_id: predictionId, ...result };
};

module.exports = { predictFoodFromImage };
