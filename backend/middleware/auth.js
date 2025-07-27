 // backend/middleware/auth.js
    const jwt = require('jsonwebtoken');

    // Middleware to verify JWT token
    function auth(req, res, next) {
        // Get token from header
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Token format: "Bearer TOKEN"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user payload to the request object
            req.user = decoded.user;
            next();
        } catch (err) {
            res.status(401).json({ message: 'Token is not valid' });
        }
    }

    // Middleware to authorize based on role
    function authorize(roles = []) {
        // roles can be a single role or an array of roles
        if (typeof roles === 'string') {
            roles = [roles];
        }

        return (req, res, next) => {
            if (!req.user || (roles.length && !roles.includes(req.user.role))) {
                return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource' });
            }
            next();
        };
    }

    module.exports = { auth, authorize };