const jwt = require('jsonwebtoken');
// Ensure that JWT_SECRET is loaded from .env.
// The .env file should be in the root of the 'backend' directory where app.js is.
// If authMiddleware.js is in a subdirectory like 'middleware', 
// and app.js (which loads dotenv) is in 'backend', then process.env should be populated.
// require('dotenv').config({ path: '../.env' }); // Usually not needed if app.js loads dotenv

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Token should be in the format "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Token error: Format should be "Bearer <token>"' });
    }
    const token = parts[1];

    if (!token) { // Double check, though split logic should handle it.
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify token
        // JWT_SECRET should be available via process.env if dotenv was configured in app.js
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user from payload to request object
        req.user = decoded.user; // Assuming payload was { user: { id: ..., username: ... } }
        next(); // Pass control to the next middleware or route handler
    } catch (ex) {
        console.error("JWT Verification Error:", ex.message);
        if (ex.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        if (ex.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Invalid token.' });
        }
        // For other errors (e.g. JWT_SECRET missing, which should be caught during dev)
        return res.status(500).json({ message: 'Failed to authenticate token.' });
    }
};
