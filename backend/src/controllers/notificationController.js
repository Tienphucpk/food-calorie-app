const NotificationModel = require('../models/NotificationModel');

const getNotifications = async (req, res) => {
    try {
        const notifications = await NotificationModel.getNotificationsByUser(req.user.id);
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markRead = async (req, res) => {
    try {
        await NotificationModel.markAsRead(req.user.id, req.params.id);
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getNotifications, markRead };
