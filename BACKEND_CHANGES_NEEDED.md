# Backend Changes Needed for Symptom Translation

## File: backend/src/routes/symptoms.js

### Change 1: Add language validation (around line 181-188)

**Find this code:**
```javascript
router.post('/check', [
    body('symptoms')
        .isArray({ min: 1 })
        .withMessage('At least one symptom is required'),
    body('symptoms.*')\n        .isMongoId()
        .withMessage('Invalid symptom ID'),
    validateRequest,
```

**Replace with:**
```javascript
router.post('/check', [
    body('symptoms')
        .isArray({ min: 1 })
        .withMessage('At least one symptom is required'),
    body('symptoms.*')
        .isMongoId()
        .withMessage('Invalid symptom ID'),
    body('language')
        .optional()
        .isIn(['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'])
        .withMessage('Invalid language code'),
    validateRequest,
```

### Change 2: Extract language from request (around line 189-191)

**Find this code:**
```javascript   
], async (req, res, next) => {
    try {
        const { symptoms } = req.body;
```

**Replace with:**
```javascript
], async (req, res, next) => {
    try {
        const { symptoms, language = 'en' } = req.body;
```

### Change 3: Add translation logic (around line 230-243)

**Find this code:**
```javascript
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
```

**Replace with:**
```javascript
        const uniqueHomeRemedies = [...new Set(allHomeRemedies)];
        const uniqueWarnings = [...new Set(allWarnings)];

        // Translate content if not English
        let translatedRemedies = uniqueHomeRemedies;
        let translatedWarnings = uniqueWarnings;

        if (language !== 'en') {
            const { translateTextArray } = await import('../utils/symptomAI.js');
            
            try {
                [translatedRemedies, translatedWarnings] = await Promise.all([
                    translateTextArray(uniqueHomeRemedies, language),
                    translateTextArray(uniqueWarnings, language)
                ]);
            } catch (error) {
                console.error('Translation error:', error);
                // Fall back to English if translation fails
            }
        }

        res.json({
            status: 'success',
            data: {
                symptoms: symptomDetails,
                suggestions: {
                    medicines: uniqueMedicines,
                    homeRemedies: translatedRemedies,
                    warnings: translatedWarnings,
                },
            },
        });
```

## Summary

These 3 changes will:
1. Accept a `language` parameter in the request
2. Use Gemini AI to translate home remedies and warnings to the user's language
3. Return translated content just like medicine details do

The translation utility (`translateTextArray`) is already created in `backend/src/utils/symptomAI.js`.
