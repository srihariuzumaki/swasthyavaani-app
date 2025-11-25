import express from 'express';
import { body } from 'express-validator';
import Reminder from '../models/Reminder.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// @route   GET /api/reminders
// @desc    Get all reminders for the user
// @access  Private
router.get('/', async (req, res, next) => {
    try {
        const { active, date } = req.query;

        let query = { user: req.user._id };

        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        const reminders = await Reminder.find(query)
            .sort({ time: 1, createdAt: -1 });

        res.json({
            status: 'success',
            data: { reminders },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/reminders/:id
// @desc    Get a specific reminder
// @access  Private
router.get('/:id', async (req, res, next) => {
    try {
        const reminder = await Reminder.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/reminders
// @desc    Create a new reminder
// @access  Private
router.post('/', [
    body('medicineName')
        .trim()
        .notEmpty()
        .withMessage('Medicine name is required')
        .isLength({ max: 100 })
        .withMessage('Medicine name cannot be more than 100 characters'),
    body('type')
        .optional()
        .isIn(['tablet', 'syrup', 'injection', 'drops', 'inhaler', 'other'])
        .withMessage('Invalid medicine type'),
    body('dosage')
        .optional()
        .trim(),
    body('times')
        .isArray({ min: 1 })
        .withMessage('At least one time is required'),
    body('times.*')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
    body('frequency')
        .isIn(['daily', 'weekly', 'once', 'custom'])
        .withMessage('Invalid frequency value'),
    body('selectedDays')
        .optional()
        .isArray()
        .withMessage('Selected days must be an array'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid start date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid end date'),
    body('instruction')
        .optional()
        .isIn(['before_food', 'after_food', 'empty_stomach', 'with_food', 'none'])
        .withMessage('Invalid instruction'),
    body('notificationIds')
        .optional()
        .isArray(),
], validateRequest, async (req, res, next) => {
    try {
        const reminderData = {
            ...req.body,
            user: req.user._id,
        };

        const reminder = new Reminder(reminderData);
        await reminder.save();

        res.status(201).json({
            status: 'success',
            message: 'Reminder created successfully',
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/reminders/:id
// @desc    Update a reminder
// @access  Private
router.put('/:id', [
    body('medicineName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Medicine name cannot be more than 100 characters'),
    body('type')
        .optional()
        .isIn(['tablet', 'syrup', 'injection', 'drops', 'inhaler', 'other'])
        .withMessage('Invalid medicine type'),
    body('dosage')
        .optional()
        .trim(),
    body('times')
        .optional()
        .isArray({ min: 1 })
        .withMessage('At least one time is required'),
    body('times.*')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
    body('frequency')
        .optional()
        .isIn(['daily', 'weekly', 'once', 'custom'])
        .withMessage('Invalid frequency value'),
    body('selectedDays')
        .optional()
        .isArray(),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid start date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid end date'),
    body('instruction')
        .optional()
        .isIn(['before_food', 'after_food', 'empty_stomach', 'with_food', 'none'])
        .withMessage('Invalid instruction'),
    body('notificationIds')
        .optional()
        .isArray(),
], validateRequest, async (req, res, next) => {
    try {
        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Reminder updated successfully',
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/reminders/:id
// @desc    Delete a reminder
// @access  Private
router.delete('/:id', async (req, res, next) => {
    try {
        const reminder = await Reminder.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Reminder deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/reminders/:id/complete
// @desc    Mark a dose as completed
// @access  Private
router.post('/:id/complete', [
    body('date')
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Notes cannot be more than 200 characters'),
], validateRequest, async (req, res, next) => {
    try {
        const { date, time, notes } = req.body;

        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $push: {
                    completedDoses: {
                        date: new Date(date),
                        time,
                        notes,
                    },
                },
            },
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Dose marked as completed',
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/reminders/:id/miss
// @desc    Mark a dose as missed
// @access  Private
router.post('/:id/miss', [
    body('date')
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason cannot be more than 200 characters'),
], validateRequest, async (req, res, next) => {
    try {
        const { date, time, reason } = req.body;

        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $push: {
                    missedDoses: {
                        date: new Date(date),
                        time,
                        reason,
                    },
                },
            },
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Dose marked as missed',
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/reminders/:id/toggle
// @desc    Toggle reminder active status
// @access  Private
router.put('/:id/toggle', async (req, res, next) => {
    try {
        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: { isActive: req.body.isActive } },
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: `Reminder ${reminder.isActive ? 'activated' : 'deactivated'}`,
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});


// @route   POST /api/reminders/:id/snooze
// @desc    Snooze a reminder
// @access  Private
router.post('/:id/snooze', [
    body('duration')
        .isInt({ min: 1, max: 120 })
        .withMessage('Duration must be between 1 and 120 minutes'),
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
], validateRequest, async (req, res, next) => {
    try {
        const { duration, time } = req.body;

        // Calculate snooze until time
        const snoozedUntil = new Date();
        snoozedUntil.setMinutes(snoozedUntil.getMinutes() + duration);

        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $set: {
                    snoozedUntil,
                    lastInteraction: new Date()
                },
                $inc: { snoozeCount: 1 }
            },
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: `Reminder snoozed for ${duration} minutes`,
            data: { reminder, snoozedUntil },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/reminders/:id/quick-complete
// @desc    Quick complete from notification action
// @access  Private
router.post('/:id/quick-complete', [
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
], validateRequest, async (req, res, next) => {
    try {
        const { time } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $push: {
                    completedDoses: {
                        date: new Date(today),
                        time,
                        completedAt: new Date()
                    },
                },
                $set: {
                    lastInteraction: new Date(),
                    snoozedUntil: null // Clear snooze if any
                }
            },
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Dose marked as taken',
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
