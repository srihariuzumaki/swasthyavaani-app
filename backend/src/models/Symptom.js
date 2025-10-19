import mongoose from 'mongoose';

const symptomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Symptom name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Symptom name cannot be more than 100 characters'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'respiratory', 'digestive', 'neurological', 'cardiovascular', 'musculoskeletal',
            'dermatological', 'genitourinary', 'endocrine', 'immune', 'mental-health', 'other'
        ],
    },
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild',
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    commonCauses: [{
        type: String,
        trim: true,
    }],
    suggestedMedicines: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
        },
        dosage: String,
        notes: String,
    }],
    homeRemedies: [{
        type: String,
        trim: true,
    }],
    whenToSeeDoctor: [{
        type: String,
        trim: true,
    }],
    relatedSymptoms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Symptom',
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    searchKeywords: [{
        type: String,
        lowercase: true,
    }],
}, {
    timestamps: true,
});

// Text index for search functionality
symptomSchema.index({
    name: 'text',
    description: 'text',
    commonCauses: 'text',
    homeRemedies: 'text',
    searchKeywords: 'text'
});

// Regular indexes
symptomSchema.index({ category: 1 });
symptomSchema.index({ severity: 1 });
symptomSchema.index({ isActive: 1 });

export default mongoose.model('Symptom', symptomSchema);
