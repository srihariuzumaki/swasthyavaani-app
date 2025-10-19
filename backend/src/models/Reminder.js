import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    medicine: {
        type: String,
        required: [true, 'Medicine name is required'],
        trim: true,
        maxlength: [100, 'Medicine name cannot be more than 100 characters'],
    },
    dosage: {
        amount: {
            type: String,
            required: [true, 'Dosage amount is required'],
            trim: true,
        },
        unit: {
            type: String,
            required: [true, 'Dosage unit is required'],
            enum: ['mg', 'ml', 'tablet', 'capsule', 'drops', 'spoon', 'other'],
        },
    },
    time: {
        type: String,
        required: [true, 'Time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)'],
    },
    frequency: {
        type: String,
        required: [true, 'Frequency is required'],
        enum: ['once', 'daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed'],
        default: 'daily',
    },
    days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
    },
    instructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Instructions cannot be more than 500 characters'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    completedDoses: [{
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
        notes: String,
    }],
    missedDoses: [{
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        reason: String,
    }],
}, {
    timestamps: true,
});

// Index for efficient queries
reminderSchema.index({ user: 1, isActive: 1 });
reminderSchema.index({ user: 1, time: 1 });

export default mongoose.model('Reminder', reminderSchema);
