const db = require('../config/db');

const GoalModel = {
    getGoalByUser: async (userId) => {
        const [rows] = await db.query('SELECT * FROM user_goals WHERE user_id = ?', [userId]);
        return rows[0];
    },
    setGoal: async (userId, data) => {
        const { target_calories, target_weight, current_weight, goal_type } = data;
        
        const existing = await GoalModel.getGoalByUser(userId);
        if (existing) {
            await db.query(
                'UPDATE user_goals SET target_calories=?, target_weight=?, current_weight=?, goal_type=? WHERE user_id=?',
                [target_calories, target_weight, current_weight, goal_type, userId]
            );
            return existing.id;
        } else {
            const [result] = await db.query(
                'INSERT INTO user_goals (user_id, target_calories, target_weight, current_weight, goal_type) VALUES (?, ?, ?, ?, ?)',
                [userId, target_calories, target_weight, current_weight, goal_type]
            );
            return result.insertId;
        }
    }
};

module.exports = GoalModel;
