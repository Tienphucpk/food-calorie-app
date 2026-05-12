const db = require('../config/db');

const AiModel = {
    saveImage: async (userId, imageUrl) => {
        const [result] = await db.query(
            'INSERT INTO food_images (user_id, image_url) VALUES (?, ?)',
            [userId, imageUrl]
        );
        return result.insertId;
    },
    savePrediction: async (imageId, foodId, confidence, version) => {
        const [result] = await db.query(
            'INSERT INTO ai_predictions (image_id, predicted_food_id, confidence, model_version) VALUES (?, ?, ?, ?)',
            [imageId, foodId, confidence, version]
        );
        return result.insertId;
    }
};

module.exports = AiModel;
