const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    if (!req.headers.authorization?.startsWith('Bearer')) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = { id: decoded.id, role: decoded.role };
        return next();
    } catch (error) {
        console.error('[Auth]', error.message);
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };