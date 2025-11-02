import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    },
    code: {
        type: String,
        required: [true, 'OTP code is required'],
        length: 6,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3,
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    purpose: {
        type: String,
        enum: ['login', 'registration', 'password_reset'],
        default: 'login',
    },
}, {
    timestamps: true,
});

// Index for efficient queries
otpSchema.index({ phone: 1, expiresAt: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

// Static method to generate OTP
otpSchema.statics.generateOTP = function (phone, purpose = 'login') {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    return this.create({
        phone,
        code,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function (phone, code, purpose = 'login') {
    // First check if there are too many attempts
    const existingOtp = await this.findOne({
        phone,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
    });

    if (existingOtp && existingOtp.attempts >= 3) {
        return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
    }

    // Find the OTP
    const otp = await this.findOne({
        phone,
        code,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
    });

    if (!otp) {
        // Increment attempts for any existing OTP for this phone
        if (existingOtp) {
            existingOtp.attempts += 1;
            await existingOtp.save();
        }
        return { valid: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    otp.isUsed = true;
    await otp.save();

    return { valid: true, message: 'OTP verified successfully', otp };
};

// Static method to clean up expired OTPs
otpSchema.statics.cleanupExpired = function () {
    return this.deleteMany({
        expiresAt: { $lt: new Date() },
    });
};

export default mongoose.model('OTP', otpSchema);
