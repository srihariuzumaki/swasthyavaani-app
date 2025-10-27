import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    },
    email: {
        type: String,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
    medicalHistory: [{
        condition: String,
        diagnosedDate: Date,
        notes: String,
    }],
    allergies: [{
        allergen: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
        },
        notes: String,
    }],
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system',
        },
        notifications: {
            reminders: { type: Boolean, default: true },
            healthTips: { type: Boolean, default: true },
            updates: { type: Boolean, default: true },
        },
        language: {
            type: String,
            default: 'en',
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    searchHistory: [{
        query: String,
        type: {
            type: String,
            enum: ['text', 'image'],
            default: 'text'
        },
        resultCount: Number,
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    personalMedicines: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: String,
        frequency: String,
        dosage: String,
    }],
}, {
    timestamps: true,
});

// OTP fields
userSchema.add({
    otp: {
        code: String,
        expiresAt: Date,
        attempts: { type: Number, default: 0 },
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
});

// Generate OTP method
userSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    this.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
    };
    return otp;
};

// Verify OTP method
userSchema.methods.verifyOTP = function (inputOTP) {
    if (!this.otp || !this.otp.code) {
        return { valid: false, message: 'No OTP found' };
    }

    if (this.otp.attempts >= 3) {
        return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
    }

    if (new Date() > this.otp.expiresAt) {
        return { valid: false, message: 'OTP expired. Please request a new one.' };
    }

    if (this.otp.code !== inputOTP) {
        this.otp.attempts += 1;
        return { valid: false, message: 'Invalid OTP' };
    }

    // OTP is valid
    this.isPhoneVerified = true;
    this.otp = undefined; // Clear OTP after successful verification
    return { valid: true, message: 'OTP verified successfully' };
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.otp;
    return userObject;
};

export default mongoose.model('User', userSchema);
