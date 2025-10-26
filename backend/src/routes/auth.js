import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateToken } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import twilio from 'twilio';

const router = express.Router();

// Initialize Twilio client
console.log('Twilio Configuration Check:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not Set');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not Set');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'Not Set');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

if (twilioClient) {
    console.log('✅ Twilio client initialized successfully');
} else {
    console.log('⚠️  Twilio client not initialized - running in development mode');
}

// Send OTP via SMS
const sendOTPviaSMS = async (phone, otpCode) => {
    console.log(`📱 Attempting to send OTP to: ${phone}`);
    
    if (!twilioClient) {
        console.log(`[DEV MODE] Would send OTP ${otpCode} to ${phone}`);
        console.log('💡 In development mode, check the API response for the OTP code');
        return { success: true, dev: true };
    }
    
    if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('TWILIO_PHONE_NUMBER is not configured');
    }
    
    try {
        console.log(`📤 Sending SMS from ${process.env.TWILIO_PHONE_NUMBER} to ${phone}`);
        
        const message = await twilioClient.messages.create({
            body: `Your Swasthya Vaani verification code is: ${otpCode}. Valid for 2 hours.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        
        console.log(`✅ SMS sent successfully with SID: ${message.sid}`);
        console.log(`📊 Message status: ${message.status}`);
        
        return { success: true, sid: message.sid, status: message.status };
    } catch (error) {
        console.error('❌ Error sending SMS:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            moreInfo: error.moreInfo,
            status: error.status
        });
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};

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
        console.log(`🔄 OTP request received for phone: ${phone}, purpose: ${purpose}`);

        // Generate and save OTP
        const otp = await OTP.generateOTP(phone, purpose);
        console.log(`🔢 Generated OTP: ${otp.code} for ${phone}`);

        // Send OTP via SMS using Twilio
        let smsSent = true;
        try {
            await sendOTPviaSMS(phone, otp.code);
            console.log(`✅ SMS sent successfully to ${phone}`);
        } catch (error) {
            console.error('❌ Failed to send SMS:', error);
            smsSent = false;
        }

        if (!smsSent && process.env.NODE_ENV !== 'development') {
            return res.status(502).json({
                status: 'error',
                message: 'Failed to send OTP via SMS. Please try again.',
            });
        }

        const response = {
            status: 'success',
            message: smsSent ? 'OTP sent successfully' : 'OTP generated (SMS not sent in dev)',
            data: {
                phone,
                expiresIn: '2 hours',
                smsSent,
                // Include OTP in development mode for testing
                otp: process.env.NODE_ENV === 'development' ? otp.code : undefined,
            },
        };

        // Add development feedback
        if (process.env.NODE_ENV === 'development' && !smsSent) {
            response.data.devMessage = 'OTP included in response for development testing';
        }

        console.log(`✅ OTP process completed successfully for ${phone}`);
        res.json(response);
    } catch (error) {
        console.error('❌ Error in send-otp route:', error);
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

        // Send OTP via SMS using Twilio
        let smsSent = true;
        try {
            await sendOTPviaSMS(phone, otp.code);
        } catch (error) {
            console.error('Failed to send SMS:', error);
            smsSent = false;
        }

        if (!smsSent && process.env.NODE_ENV !== 'development') {
            return res.status(502).json({
                status: 'error',
                message: 'Failed to send OTP via SMS. Please try again.',
            });
        }

        res.json({
            status: 'success',
            message: smsSent ? 'OTP resent successfully' : 'OTP generated (SMS not sent in dev)',
            data: {
                phone,
                expiresIn: '2 hours',
                smsSent,
                // Remove this in production
                otp: process.env.NODE_ENV === 'development' ? otp.code : undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
