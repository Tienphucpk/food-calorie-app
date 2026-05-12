const db = require('../config/db');

const ChatModel = {
    saveMessage: async (userId, sender, message) => {
        const [result] = await db.query(
            'INSERT INTO chat_history (user_id, sender, message) VALUES (?, ?, ?)',
            [userId, sender, message]
        );
        return result.insertId;
    },
    getHistory: async (userId) => {
        const [rows] = await db.query(
            'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC',
            [userId]
        );
        return rows;
    }
};

module.exports = ChatModel;
