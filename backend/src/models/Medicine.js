import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Medicine name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Medicine name cannot be more than 100 characters'],
    },
    // Multilingual names for medicine
    translations: {
        en: { name: String, genericName: String, description: String },
        hi: { name: String, genericName: String, description: String },
        ta: { name: String, genericName: String, description: String },
        te: { name: String, genericName: String, description: String },
        bn: { name: String, genericName: String, description: String },
        mr: { name: String, genericName: String, description: String },
        gu: { name: String, genericName: String, description: String },
        kn: { name: String, genericName: String, description: String },
    },
    genericName: {
        type: String,
        trim: true,
        maxlength: [100, 'Generic name cannot be more than 100 characters'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'analgesic', 'antipyretic', 'anti-inflammatory', 'antibiotic', 'antihistamine',
            'antacid', 'vitamin', 'supplement', 'cough-syrup', 'topical', 'diabetes', 'other'
        ],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    // Multilingual indications/uses
    multilingualIndications: {
        en: [String],
        hi: [String],
        ta: [String],
        te: [String],
        bn: [String],
        mr: [String],
        gu: [String],
        kn: [String],
    },
    indications: [{
        type: String,
        trim: true,
    }],
    dosage: {
        adult: {
            min: String,
            max: String,
            unit: String,
            frequency: String,
        },
        pediatric: {
            min: String,
            max: String,
            unit: String,
            frequency: String,
        },
    },
    sideEffects: [{
        type: String,
        trim: true,
    }],
    contraindications: [{
        type: String,
        trim: true,
    }],
    interactions: [{
        medicine: String,
        effect: String,
    }],
    warnings: [{
        type: String,
        trim: true,
    }],
    storageInstructions: {
        type: String,
        trim: true,
    },
    isPrescriptionRequired: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    image: {
        type: String,
        trim: true,
    },
    ageRestrictions: {
        minimumAge: {
            value: String,
            unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], default: 'years' }
        },
        maximumAge: {
            value: String,
            unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], default: 'years' }
        },
        notes: String,
    },
    rxNormId: {
        type: String,
        trim: true,
    },
    ndcCode: {
        type: String,
        trim: true,
    },
    medlinePlusUrl: {
        type: String,
        trim: true,
    },
    usage: String,
    precautions: [{
        type: String,
        trim: true,
    }],
    storageInstructions: {
        type: String,
        trim: true,
    },
    searchKeywords: [{
        type: String,
        lowercase: true,
    }],
}, {
    timestamps: true,
});

// Text index for search functionality
medicineSchema.index({
    name: 'text',
    genericName: 'text',
    description: 'text',
    indications: 'text',
    searchKeywords: 'text'
});

// Regular indexes
medicineSchema.index({ category: 1 });
medicineSchema.index({ isActive: 1 });

export default mongoose.model('Medicine', medicineSchema);
