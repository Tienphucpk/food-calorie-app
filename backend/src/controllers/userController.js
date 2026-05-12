const db = require('../config/db');

const updateProfile = async (req, res) => {
    try {
        const { full_name, avatar_url } = req.body;
        await db.query(
            'UPDATE users SET full_name = ?, avatar_url = ? WHERE id = ?',
            [full_name, avatar_url, req.user.id]
        );
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { updateProfile };