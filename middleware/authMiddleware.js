const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError'); // Assuming you have an ApiError class

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Expecting a token in the format 'Bearer TOKEN'

    if (!token) {
        return res.status(401).json({ status: 401, message: 'Access denied, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        req.userId = decoded.userId; // Set userId in request object
        next();
    } catch (error) {
        res.status(403).json({ status: 403, message: 'Invalid or expired token' });
    }
};

module.exports = authenticateToken;
