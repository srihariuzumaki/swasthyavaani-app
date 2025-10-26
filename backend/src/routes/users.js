import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import Medicine from '../models/Medicine.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// @route   POST /api/users/search-history
// @desc    Save user search history
// @access  Private
router.post('/search-history', [
    body('query').notEmpty().withMessage('Search query is required'),
    body('type').isIn(['text', 'image']).withMessage('Type must be text or image'),
    body('resultCount').optional().isNumeric().withMessage('Result count must be a number'),
    body('medicineId').optional().isMongoId().withMessage('Invalid medicine ID'),
], validateRequest, async (req, res, next) => {
    try {
        const { query, type, resultCount, medicineId } = req.body;
        
        const searchEntry = {
            query,
            type,
            resultCount: resultCount || 0,
            timestamp: new Date()
        };
        
        if (medicineId) {
            searchEntry.medicine = medicineId;
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { searchHistory: { $each: [searchEntry], $position: 0, $slice: 50 } } },
            { new: true }
        );
        
        res.json({
            status: 'success',
            message: 'Search history saved'
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .matches(/^\+?[\d\s-()]+$/)
        .withMessage('Please provide a valid phone number'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
        .withMessage('Invalid gender value'),
], validateRequest, async (req, res, next) => {
    try {
        const { name, phone, dateOfBirth, gender } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
        if (gender) updateData.gender = gender;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
    body('theme')
        .optional()
        .isIn(['light', 'dark', 'system'])
        .withMessage('Invalid theme value'),
    body('language')
        .optional()
        .isLength({ min: 2, max: 5 })
        .withMessage('Invalid language code'),
], validateRequest, async (req, res, next) => {
    try {
        const { theme, language, notifications } = req.body;

        const updateData = {};
        if (theme) updateData['preferences.theme'] = theme;
        if (language) updateData['preferences.language'] = language;
        if (notifications) {
            if (typeof notifications.reminders === 'boolean') {
                updateData['preferences.notifications.reminders'] = notifications.reminders;
            }
            if (typeof notifications.healthTips === 'boolean') {
                updateData['preferences.notifications.healthTips'] = notifications.healthTips;
            }
            if (typeof notifications.updates === 'boolean') {
                updateData['preferences.notifications.updates'] = notifications.updates;
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            status: 'success',
            message: 'Preferences updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/users/medical-history
// @desc    Add medical history entry
// @access  Private
router.post('/medical-history', [
    body('condition')
        .trim()
        .notEmpty()
        .withMessage('Condition is required'),
    body('diagnosedDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot be more than 500 characters'),
], validateRequest, async (req, res, next) => {
    try {
        const { condition, diagnosedDate, notes } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    medicalHistory: {
                        condition,
                        diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : undefined,
                        notes,
                    },
                },
            },
            { new: true, runValidators: true }
        );

        res.json({
            status: 'success',
            message: 'Medical history entry added successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/users/allergies
// @desc    Add allergy entry
// @access  Private
router.post('/allergies', [
    body('allergen')
        .trim()
        .notEmpty()
        .withMessage('Allergen is required'),
    body('severity')
        .isIn(['mild', 'moderate', 'severe'])
        .withMessage('Invalid severity value'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot be more than 500 characters'),
], validateRequest, async (req, res, next) => {
    try {
        const { allergen, severity, notes } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    allergies: {
                        allergen,
                        severity,
                        notes,
                    },
                },
            },
            { new: true, runValidators: true }
        );

        res.json({
            status: 'success',
            message: 'Allergy entry added successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/users/medical-history/:index
// @desc    Remove medical history entry
// @access  Private
router.delete('/medical-history/:index', async (req, res, next) => {
    try {
        const index = parseInt(req.params.index);

        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid index',
            });
        }

        const user = await User.findById(req.user._id);
        if (!user.medicalHistory[index]) {
            return res.status(404).json({
                status: 'error',
                message: 'Medical history entry not found',
            });
        }

        user.medicalHistory.splice(index, 1);
        await user.save();

        res.json({
            status: 'success',
            message: 'Medical history entry removed successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/users/allergies/:index
// @desc    Remove allergy entry
// @access  Private
router.delete('/allergies/:index', async (req, res, next) => {
    try {
        const index = parseInt(req.params.index);

        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid index',
            });
        }

        const user = await User.findById(req.user._id);
        if (!user.allergies[index]) {
            return res.status(404).json({
                status: 'error',
                message: 'Allergy entry not found',
            });
        }

        user.allergies.splice(index, 1);
        await user.save();

        res.json({
            status: 'success',
            message: 'Allergy entry removed successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
