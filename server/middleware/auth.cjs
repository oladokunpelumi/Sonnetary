const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yourgbedu.com';

/**
 * Middleware: Verify JWT and attach user to request.
 * Required for any route that needs authentication.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Middleware: Verify JWT and ensure user has admin role.
 * Required for admin dashboard routes.
 */
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
        next();
    });
}

/**
 * Helper: Generate JWT token for a user or admin.
 * Accepts either:
 *   - { id, email } for regular users (role derived from ADMIN_EMAIL check)
 *   - { id, role: 'admin' } for direct admin token generation (email not required)
 */
function generateToken(user) {
    // If a role is explicitly provided (e.g. from admin login), trust it directly.
    // Otherwise derive role by comparing email to the configured admin email.
    const role = user.role || (
        user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
            ? 'admin'
            : 'user'
    );

    return jwt.sign(
        { userId: user.id, email: user.email || null, role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = {
    requireAuth,
    requireAdmin,
    generateToken
};
