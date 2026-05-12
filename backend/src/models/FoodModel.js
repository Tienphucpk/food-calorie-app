const db = require('../config/db');

const FoodModel = {
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM foods ORDER BY created_at DESC');
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM foods WHERE id = ?', [id]);
        return rows[0];
    },
    create: async (foodData) => {
        const { name, base_calories, protein, carbs, fat, fiber, serving_size } = foodData;
        const [result] = await db.query(
            'INSERT INTO foods (name, base_calories, protein, carbs, fat, fiber, serving_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, base_calories, protein || 0, carbs || 0, fat || 0, fiber || 0, serving_size || '100g']
        );
        return result.insertId;
    }
};

module.exports = FoodModel;
