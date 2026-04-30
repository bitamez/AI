const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Continue without user if token is invalid
            req.user = null;
        }
    }

    next();
};

// Check subscription access
const checkSubscription = (requiredPlan = 'free') => {
    return (req, res, next) => {
        const planHierarchy = { free: 0, pro: 1, premium: 2 };
        const userPlan = req.user.subscription?.plan || 'free';
        const userPlanLevel = planHierarchy[userPlan];
        const requiredPlanLevel = planHierarchy[requiredPlan];

        if (userPlanLevel < requiredPlanLevel) {
            return res.status(403).json({
                success: false,
                message: `This feature requires ${requiredPlan} subscription or higher`,
                currentPlan: userPlan,
                requiredPlan: requiredPlan
            });
        }

        // Check if subscription is active (for paid plans)
        if (requiredPlan !== 'free' && req.user.subscription) {
            const now = new Date();
            const endDate = new Date(req.user.subscription.endDate);

            if (req.user.subscription.status !== 'active' || now > endDate) {
                return res.status(403).json({
                    success: false,
                    message: 'Subscription has expired or is inactive',
                    subscriptionStatus: req.user.subscription.status,
                    endDate: req.user.subscription.endDate
                });
            }
        }

        next();
    };
};

// Rate limiting for specific users
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) return next();

        const now = Date.now();
        const userRequests = requests.get(userId) || { count: 0, resetTime: now + windowMs };

        if (now > userRequests.resetTime) {
            userRequests.count = 0;
            userRequests.resetTime = now + windowMs;
        }

        userRequests.count++;
        requests.set(userId, userRequests);

        if (userRequests.count > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
                resetTime: new Date(userRequests.resetTime).toISOString()
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorize,
    optionalAuth,
    checkSubscription,
    userRateLimit
};