import express from 'express';
import { body, query } from 'express-validator';
import Medicine from '../models/Medicine.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

// @route   GET /api/medicines
// @desc    Search medicines
// @access  Public
router.get('/', [
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Search query cannot be empty'),
    query('category')
        .optional()
        .isIn([
            'analgesic', 'antipyretic', 'anti-inflammatory', 'antibiotic', 'antihistamine',
            'antacid', 'vitamin', 'supplement', 'cough-syrup', 'topical', 'other'
        ])
        .withMessage('Invalid category'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
], validateRequest, async (req, res, next) => {
    try {
        const { search, category, page = 1, limit = 20 } = req.query;

        let query = { isActive: true };

        // Add search functionality
        if (search) {
            query.$text = { $search: search };
        }

        // Add category filter
        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const medicines = await Medicine.find(query)
            .select('-__v')
            .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Medicine.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                medicines,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalMedicines: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/medicines/:id
// @desc    Get medicine details
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine || !medicine.isActive) {
            return res.status(404).json({
                status: 'error',
                message: 'Medicine not found',
            });
        }

        res.json({
            status: 'success',
            data: { medicine },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/medicines/categories/list
// @desc    Get all medicine categories
// @access  Public
router.get('/categories/list', async (req, res, next) => {
    try {
        const categories = await Medicine.distinct('category', { isActive: true });

        res.json({
            status: 'success',
            data: { categories },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/medicines/popular
// @desc    Get popular medicines
// @access  Public
router.get('/popular', async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const medicines = await Medicine.find({ isActive: true })
            .select('name genericName category description')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            status: 'success',
            data: { medicines },
        });
    } catch (error) {
        next(error);
    }
});

// Admin routes (require authentication)
router.use(authenticate);

// @route   POST /api/medicines
// @desc    Create a new medicine (Admin only)
// @access  Private
router.post('/', [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Medicine name is required')
        .isLength({ max: 100 })
        .withMessage('Medicine name cannot be more than 100 characters'),
    body('genericName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Generic name cannot be more than 100 characters'),
    body('category')
        .isIn([
            'analgesic', 'antipyretic', 'anti-inflammatory', 'antibiotic', 'antihistamine',
            'antacid', 'vitamin', 'supplement', 'cough-syrup', 'topical', 'other'
        ])
        .withMessage('Invalid category'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot be more than 1000 characters'),
    body('isPrescriptionRequired')
        .optional()
        .isBoolean()
        .withMessage('isPrescriptionRequired must be a boolean'),
], validateRequest, async (req, res, next) => {
    try {
        const medicine = new Medicine(req.body);
        await medicine.save();

        res.status(201).json({
            status: 'success',
            message: 'Medicine created successfully',
            data: { medicine },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/medicines/:id
// @desc    Update a medicine (Admin only)
// @access  Private
router.put('/:id', [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Medicine name cannot be more than 100 characters'),
    body('genericName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Generic name cannot be more than 100 characters'),
    body('category')
        .optional()
        .isIn([
            'analgesic', 'antipyretic', 'anti-inflammatory', 'antibiotic', 'antihistamine',
            'antacid', 'vitamin', 'supplement', 'cough-syrup', 'topical', 'other'
        ])
        .withMessage('Invalid category'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot be more than 1000 characters'),
    body('isPrescriptionRequired')
        .optional()
        .isBoolean()
        .withMessage('isPrescriptionRequired must be a boolean'),
], validateRequest, async (req, res, next) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!medicine) {
            return res.status(404).json({
                status: 'error',
                message: 'Medicine not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Medicine updated successfully',
            data: { medicine },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/medicines/:id
// @desc    Delete a medicine (Admin only)
// @access  Private
router.delete('/:id', async (req, res, next) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!medicine) {
            return res.status(404).json({
                status: 'error',
                message: 'Medicine not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Medicine deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
