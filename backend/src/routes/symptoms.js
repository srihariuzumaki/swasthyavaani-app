import express from 'express';
import { body, query } from 'express-validator';
import Symptom from '../models/Symptom.js';
import Medicine from '../models/Medicine.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

// @route   GET /api/symptoms
// @desc    Search symptoms
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
            'respiratory', 'digestive', 'neurological', 'cardiovascular', 'musculoskeletal',
            'dermatological', 'genitourinary', 'endocrine', 'immune', 'mental-health', 'other'
        ])
        .withMessage('Invalid category'),
    query('severity')
        .optional()
        .isIn(['mild', 'moderate', 'severe'])
        .withMessage('Invalid severity'),
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
        const { search, category, severity, page = 1, limit = 20 } = req.query;

        let query = { isActive: true };

        // Add search functionality
        if (search) {
            query.$text = { $search: search };
        }

        // Add category filter
        if (category) {
            query.category = category;
        }

        // Add severity filter
        if (severity) {
            query.severity = severity;
        }

        const skip = (page - 1) * limit;

        const symptoms = await Symptom.find(query)
            .populate('suggestedMedicines.medicine', 'name genericName category')
            .populate('relatedSymptoms', 'name category severity')
            .select('-__v')
            .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Symptom.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                symptoms,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalSymptoms: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/symptoms/:id
// @desc    Get symptom details
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const symptom = await Symptom.findById(req.params.id)
            .populate('suggestedMedicines.medicine', 'name genericName category description dosage sideEffects')
            .populate('relatedSymptoms', 'name category severity description');

        if (!symptom || !symptom.isActive) {
            return res.status(404).json({
                status: 'error',
                message: 'Symptom not found',
            });
        }

        res.json({
            status: 'success',
            data: { symptom },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/symptoms/categories/list
// @desc    Get all symptom categories
// @access  Public
router.get('/categories/list', async (req, res, next) => {
    try {
        const categories = await Symptom.distinct('category', { isActive: true });

        res.json({
            status: 'success',
            data: { categories },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/symptoms/common
// @desc    Get common symptoms
// @access  Public
router.get('/common', async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const symptoms = await Symptom.find({ isActive: true })
            .select('name category severity description')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            status: 'success',
            data: { symptoms },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/symptoms/check
// @desc    Check symptoms and get suggestions
// @access  Public
router.post('/check', [
    body('symptoms')
        .isArray({ min: 1 })
        .withMessage('At least one symptom is required'),
    body('symptoms.*')
        .isMongoId()
        .withMessage('Invalid symptom ID'),
], validateRequest, async (req, res, next) => {
    try {
        const { symptoms } = req.body;

        const symptomDetails = await Symptom.find({
            _id: { $in: symptoms },
            isActive: true,
        })
            .populate('suggestedMedicines.medicine', 'name genericName category description dosage')
            .populate('relatedSymptoms', 'name category severity');

        if (symptomDetails.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No symptoms found',
            });
        }

        // Collect all suggested medicines
        const allMedicines = [];
        const allHomeRemedies = [];
        const allWarnings = [];

        symptomDetails.forEach(symptom => {
            if (symptom.suggestedMedicines) {
                allMedicines.push(...symptom.suggestedMedicines);
            }
            if (symptom.homeRemedies) {
                allHomeRemedies.push(...symptom.homeRemedies);
            }
            if (symptom.whenToSeeDoctor) {
                allWarnings.push(...symptom.whenToSeeDoctor);
            }
        });

        // Remove duplicates
        const uniqueMedicines = allMedicines.filter((medicine, index, self) =>
            index === self.findIndex(m => m.medicine._id.toString() === medicine.medicine._id.toString())
        );

        const uniqueHomeRemedies = [...new Set(allHomeRemedies)];
        const uniqueWarnings = [...new Set(allWarnings)];

        res.json({
            status: 'success',
            data: {
                symptoms: symptomDetails,
                suggestions: {
                    medicines: uniqueMedicines,
                    homeRemedies: uniqueHomeRemedies,
                    warnings: uniqueWarnings,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Admin routes (require authentication)
router.use(authenticate);

// @route   POST /api/symptoms
// @desc    Create a new symptom (Admin only)
// @access  Private
router.post('/', [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Symptom name is required')
        .isLength({ max: 100 })
        .withMessage('Symptom name cannot be more than 100 characters'),
    body('category')
        .isIn([
            'respiratory', 'digestive', 'neurological', 'cardiovascular', 'musculoskeletal',
            'dermatological', 'genitourinary', 'endocrine', 'immune', 'mental-health', 'other'
        ])
        .withMessage('Invalid category'),
    body('severity')
        .optional()
        .isIn(['mild', 'moderate', 'severe'])
        .withMessage('Invalid severity'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot be more than 500 characters'),
], validateRequest, async (req, res, next) => {
    try {
        const symptom = new Symptom(req.body);
        await symptom.save();

        res.status(201).json({
            status: 'success',
            message: 'Symptom created successfully',
            data: { symptom },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/symptoms/:id
// @desc    Update a symptom (Admin only)
// @access  Private
router.put('/:id', [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Symptom name cannot be more than 100 characters'),
    body('category')
        .optional()
        .isIn([
            'respiratory', 'digestive', 'neurological', 'cardiovascular', 'musculoskeletal',
            'dermatological', 'genitourinary', 'endocrine', 'immune', 'mental-health', 'other'
        ])
        .withMessage('Invalid category'),
    body('severity')
        .optional()
        .isIn(['mild', 'moderate', 'severe'])
        .withMessage('Invalid severity'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot be more than 500 characters'),
], validateRequest, async (req, res, next) => {
    try {
        const symptom = await Symptom.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!symptom) {
            return res.status(404).json({
                status: 'error',
                message: 'Symptom not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Symptom updated successfully',
            data: { symptom },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/symptoms/:id
// @desc    Delete a symptom (Admin only)
// @access  Private
router.delete('/:id', async (req, res, next) => {
    try {
        const symptom = await Symptom.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!symptom) {
            return res.status(404).json({
                status: 'error',
                message: 'Symptom not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Symptom deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
