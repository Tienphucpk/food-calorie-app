const db = require('../config/db');

const NotificationModel = {
    getNotificationsByUser: async (userId) => {
        const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows;
    },
    markAsRead: async (userId, notificationId) => {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notificationId, userId]);
    }
};

module.exports = NotificationModel;
