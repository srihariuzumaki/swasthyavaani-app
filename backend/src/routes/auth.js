import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateToken } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

// @route   POST /api/auth/send-otp
// @desc    Send OTP to mobile number
// @access  Public
router.post('/send-otp', [
    body('phone')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid phone number'),
    body('purpose')
        .optional()
        .isIn(['login', 'registration'])
        .withMessage('Invalid purpose'),
], validateRequest, async (req, res, next) => {
    try {
        const { phone, purpose = 'login' } = req.body;

        // Generate and save OTP
        const otp = await OTP.generateOTP(phone, purpose);

        // TODO: In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
        // For development, we'll return the OTP in response
        console.log(`OTP for ${phone}: ${otp.code}`);

        res.json({
            status: 'success',
            message: 'OTP sent successfully',
            data: {
                phone,
                expiresIn: '10 minutes',
                // Remove this in production
                otp: process.env.NODE_ENV === 'development' ? otp.code : undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register user
// @access  Public
router.post('/verify-otp', [
    body('phone')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid phone number'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
], validateRequest, async (req, res, next) => {
    try {
        const { phone, otp, name, dateOfBirth, gender } = req.body;

        // Check if user exists first
        let user = await User.findOne({ phone });

        if (!user) {
            // Register new user
            if (!name) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Name is required for new user registration',
                });
            }
        }

        // Verify OTP only after we know we have all required data
        const otpResult = await OTP.verifyOTP(phone, otp, 'login');
        if (!otpResult.valid) {
            return res.status(400).json({
                status: 'error',
                message: otpResult.message,
            });
        }

        if (!user) {
            // Register new user
            user = new User({
                name,
                phone,
                dateOfBirth,
                gender,
                isPhoneVerified: true,
            });
            await user.save();
        } else {
            // Update last login for existing user
            user.lastLogin = new Date();
            await user.save();
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            status: 'success',
            message: user.isNew ? 'User registered successfully' : 'Login successful',
            data: {
                user: user.toJSON(),
                token,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to mobile number
// @access  Public
router.post('/resend-otp', [
    body('phone')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid phone number'),
], validateRequest, async (req, res, next) => {
    try {
        const { phone } = req.body;

        // Clean up any existing OTPs for this phone
        await OTP.deleteMany({ phone, isUsed: false });

        // Generate new OTP
        const otp = await OTP.generateOTP(phone, 'login');

        // TODO: In production, send OTP via SMS service
        console.log(`Resend OTP for ${phone}: ${otp.code}`);

        res.json({
            status: 'success',
            message: 'OTP resent successfully',
            data: {
                phone,
                expiresIn: '10 minutes',
                // Remove this in production
                otp: process.env.NODE_ENV === 'development' ? otp.code : undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
