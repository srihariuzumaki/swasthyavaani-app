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
    body('medicine')
        .trim()
        .notEmpty()
        .withMessage('Medicine name is required')
        .isLength({ max: 100 })
        .withMessage('Medicine name cannot be more than 100 characters'),
    body('dosage.amount')
        .trim()
        .notEmpty()
        .withMessage('Dosage amount is required'),
    body('dosage.unit')
        .isIn(['mg', 'ml', 'tablet', 'capsule', 'drops', 'spoon', 'other'])
        .withMessage('Invalid dosage unit'),
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
    body('frequency')
        .isIn(['once', 'daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed'])
        .withMessage('Invalid frequency value'),
    body('startDate')
        .isISO8601()
        .withMessage('Please provide a valid start date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid end date'),
    body('instructions')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Instructions cannot be more than 500 characters'),
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
    body('medicine')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Medicine name cannot be more than 100 characters'),
    body('dosage.amount')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Dosage amount cannot be empty'),
    body('dosage.unit')
        .optional()
        .isIn(['mg', 'ml', 'tablet', 'capsule', 'drops', 'spoon', 'other'])
        .withMessage('Invalid dosage unit'),
    body('time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
    body('frequency')
        .optional()
        .isIn(['once', 'daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed'])
        .withMessage('Invalid frequency value'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid start date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid end date'),
    body('instructions')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Instructions cannot be more than 500 characters'),
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

export default router;
