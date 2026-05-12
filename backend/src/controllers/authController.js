const UserModel = require('../models/UserModel');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
        const userExists = await UserModel.findByEmail(email);
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const userId = await UserModel.create({ email, password, full_name });
        
        res.status(201).json({
            success: true,
            user: { id: userId, email, full_name },
            token: generateToken(userId, 'user')
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findByEmail(email);
        
        if (user && (await UserModel.matchPassword(password, user.password_hash))) {
            res.json({
                success: true,
                user: { id: user.id, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url, role: user.role },
                token: generateToken(user.id, user.role)
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { registerUser, loginUser, getProfile };