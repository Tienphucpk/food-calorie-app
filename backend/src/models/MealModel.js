const db = require('../config/db');

/**
 * Tự động thêm cột food_name và notes nếu chưa có.
 * Chạy 1 lần khi server khởi động.
 */
const runMigration = async () => {
    try {
        await db.query(`
            ALTER TABLE meals
                ADD COLUMN IF NOT EXISTS food_name VARCHAR(255) NULL AFTER meal_date,
                ADD COLUMN IF NOT EXISTS notes VARCHAR(500) NULL AFTER food_name
        `);
        console.log('[MealModel] Migration OK: food_name, notes columns ready.');
    } catch (err) {
        // MySQL 5.x không hỗ trợ IF NOT EXISTS → thử cách khác
        try {
            const [cols] = await db.query(`SHOW COLUMNS FROM meals LIKE 'food_name'`);
            if (cols.length === 0) {
                await db.query(`ALTER TABLE meals ADD COLUMN food_name VARCHAR(255) NULL AFTER meal_date`);
                await db.query(`ALTER TABLE meals ADD COLUMN notes VARCHAR(500) NULL AFTER food_name`);
                console.log('[MealModel] Migration OK (fallback): food_name, notes added.');
            }
        } catch (e) {
            console.warn('[MealModel] Migration warning:', e.message);
        }
    }
};

runMigration();

const MealModel = {
    saveMeal: async (userId, mealType, totalCalories, mealDate, foodName = null, notes = null) => {
        const [result] = await db.query(
            `INSERT INTO meals (user_id, meal_type, total_calories, meal_date, food_name, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, mealType, totalCalories, mealDate, foodName, notes]
        );
        return result.insertId;
    },

    saveMealDetails: async (mealId, foodId, aiPredictionId, quantity) => {
        const [result] = await db.query(
            'INSERT INTO meal_details (meal_id, food_id, ai_prediction_id, quantity) VALUES (?, ?, ?, ?)',
            [mealId, foodId || null, aiPredictionId || null, quantity]
        );
        return result.insertId;
    },

    getHistory: async (userId) => {
        const [rows] = await db.query(`
            SELECT
                m.id             AS meal_id,
                m.meal_type,
                m.total_calories,
                m.meal_date,
                m.food_name,
                m.notes,
                m.created_at,
                a.confidence,
                a.model_version
            FROM meals m
            LEFT JOIN meal_details md ON m.id = md.meal_id
            LEFT JOIN ai_predictions a  ON md.ai_prediction_id = a.id
            WHERE m.user_id = ?
            GROUP BY m.id
            ORDER BY m.meal_date DESC, m.created_at DESC
            LIMIT 50
        `, [userId]);
        return rows;
    },

    deleteMeal: async (mealId, userId) => {
        await db.query(
            'DELETE FROM meals WHERE id = ? AND user_id = ?',
            [mealId, userId]
        );
    }
};

module.exports = MealModel;
