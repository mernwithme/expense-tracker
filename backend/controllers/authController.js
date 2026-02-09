import User from '../models/User.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
    try {
        console.log('📝 Registration attempt:', { email: req.body.email, name: req.body.name });
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('❌ Registration failed: User already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user (password will be hashed by pre-save hook)
        const user = new User({
            name,
            email,
            password
        });

        await user.save();
        console.log('✅ User created successfully:', email);

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        console.log('✅ Registration successful for:', email);

        // Return user data and tokens
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

/**
 * Login user
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email (include password field)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
    try {
        // User is attached by authenticateRefreshToken middleware
        const user = req.userModel;

        // Generate new access token
        const accessToken = user.generateAccessToken();

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing token',
            error: error.message
        });
    }
};

/**
 * Logout user (clear refresh token)
 */
export const logout = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Clear refresh token from database
        await User.findByIdAndUpdate(userId, { refreshToken: null });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};
