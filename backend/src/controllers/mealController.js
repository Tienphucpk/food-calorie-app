const { predictFoodFromImage } = require('../ai/predictFood');
const MealModel = require('../models/MealModel');
const db = require('../config/db');

/**
 * POST /api/meals/analyze
 */
const analyzeMeal = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }
        const imagePath = req.file.path;
        const analysis = await predictFoodFromImage(req.user.id, imagePath);
        res.json({ success: true, data: analysis });
    } catch (error) {
        console.error('[analyzeMeal] Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/meals/save
 * Body: { meal_type, meal_date, food_name, calories, protein, carbs, fat, ai_prediction_id }
 */
const saveMeal = async (req, res) => {
    console.log('[saveMeal] Body received:', JSON.stringify(req.body));
    console.log('[saveMeal] User ID:', req.user?.id);

    try {
        const { meal_type, meal_date, food_name, calories, protein, carbs, fat, ai_prediction_id } = req.body;

        if (!meal_type || !meal_date) {
            return res.status(400).json({ success: false, message: 'meal_type và meal_date là bắt buộc' });
        }

        const totalCalories = parseFloat(calories) || 0;
        const notes = `P:${protein||0}g C:${carbs||0}g F:${fat||0}g`;

        let mealId;

        // Thử lưu với food_name (cột mới)
        try {
            const [result] = await db.query(
                `INSERT INTO meals (user_id, meal_type, total_calories, meal_date, food_name, notes)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.user.id, meal_type, totalCalories, meal_date, food_name || null, notes]
            );
            mealId = result.insertId;
            console.log('[saveMeal] Saved with food_name, meal_id:', mealId);
        } catch (colErr) {
            // Fallback: nếu cột food_name chưa tồn tại
            console.warn('[saveMeal] food_name column missing, trying fallback:', colErr.message);
            const [result] = await db.query(
                `INSERT INTO meals (user_id, meal_type, total_calories, meal_date)
                 VALUES (?, ?, ?, ?)`,
                [req.user.id, meal_type, totalCalories, meal_date]
            );
            mealId = result.insertId;
            console.log('[saveMeal] Saved without food_name (fallback), meal_id:', mealId);
        }

        // Lưu meal_details nếu có prediction
        if (ai_prediction_id) {
            try {
                await db.query(
                    `INSERT INTO meal_details (meal_id, food_id, ai_prediction_id, quantity)
                     VALUES (?, NULL, ?, 1)`,
                    [mealId, ai_prediction_id]
                );
            } catch (detailErr) {
                console.warn('[saveMeal] Could not save meal_details:', detailErr.message);
                // Không crash — meal đã lưu rồi
            }
        }

        res.status(201).json({
            success: true,
            message: 'Meal saved successfully',
            meal_id: mealId
        });

    } catch (error) {
        console.error('[saveMeal] FATAL Error:', error.message, '\nStack:', error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/meals/history
 */
const getMealHistory = async (req, res) => {
    try {
        const history = await MealModel.getHistory(req.user.id);
        res.json({ success: true, history });
    } catch (error) {
        console.error('[getMealHistory] Error:', error.message);

        // Fallback query nếu cột food_name chưa tồn tại
        try {
            const [rows] = await db.query(
                `SELECT id AS meal_id, meal_type, total_calories, meal_date, created_at
                 FROM meals WHERE user_id = ?
                 ORDER BY meal_date DESC LIMIT 50`,
                [req.user.id]
            );
            res.json({ success: true, history: rows });
        } catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    }
};

/**
 * DELETE /api/meals/:id
 */
const deleteMeal = async (req, res) => {
    try {
        await db.query('DELETE FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Meal deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { analyzeMeal, saveMeal, getMealHistory, deleteMeal };
