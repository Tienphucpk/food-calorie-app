const db = require('../config/db');

const ExerciseModel = {
    addExercise: async (userId, data) => {
        const { exercise_name, duration_minutes, calories_burned, exercise_date } = data;
        const [result] = await db.query(
            'INSERT INTO exercise_logs (user_id, exercise_name, duration_minutes, calories_burned, exercise_date) VALUES (?, ?, ?, ?, ?)',
            [userId, exercise_name, duration_minutes, calories_burned, exercise_date]
        );
        return result.insertId;
    },
    getExercisesByUser: async (userId) => {
        const [rows] = await db.query('SELECT * FROM exercise_logs WHERE user_id = ? ORDER BY exercise_date DESC', [userId]);
        return rows;
    }
};

module.exports = ExerciseModel;
