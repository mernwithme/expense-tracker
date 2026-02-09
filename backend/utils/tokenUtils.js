import jwt from 'jsonwebtoken';

/**
 * Generate access token
 */
export const generateAccessToken = (userId, email) => {
    return jwt.sign(
        { userId, email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        throw error;
    }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw error;
    }
};
