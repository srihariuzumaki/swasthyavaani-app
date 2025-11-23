import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    medicineName: {
        type: String,
        required: [true, 'Medicine name is required'],
        trim: true,
        maxlength: [100, 'Medicine name cannot be more than 100 characters'],
    },
    type: {
        type: String,
        enum: ['tablet', 'syrup', 'injection', 'drops', 'inhaler', 'other'],
        default: 'tablet'
    },
    dosage: {
        type: String,
        trim: true,
        default: ''
    },
    times: [{
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
    }],
    frequency: {
        type: String,
        required: [true, 'Frequency is required'],
        enum: ['daily', 'weekly', 'once', 'custom'],
        default: 'daily',
    },
    selectedDays: [{
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    }],
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    instruction: {
        type: String,
        enum: ['before_food', 'after_food', 'empty_stomach', 'with_food', 'none'],
        default: 'none'
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    notificationIds: [{
        type: Number
    }],
    completedDoses: [{
        date: Date,
        time: String,
        completedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
});

// Index for efficient queries
reminderSchema.index({ user: 1, isActive: 1 });
reminderSchema.index({ user: 1, time: 1 });

export default mongoose.model('Reminder', reminderSchema);
