const db = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },
    findById: async (id) => {
        const [rows] = await db.query('SELECT id, email, full_name, avatar_url, role FROM users WHERE id = ?', [id]);
        return rows[0];
    },
    create: async (userData) => {
        const { email, password, full_name } = userData;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [result] = await db.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
            [email, hashedPassword, full_name]
        );
        return result.insertId;
    },
    matchPassword: async (enteredPassword, hashedPassword) => {
        return await bcrypt.compare(enteredPassword, hashedPassword);
    }
};

module.exports = UserModel;
