# Advanced OCR Setup Guide

## Environment Variables

Add the following environment variables to your `backend/.env` file:

```env
# Google Vision API (Primary OCR Engine)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# Gemini AI (For validation and intelligent extraction)
GEMINI_API_KEY=your_gemini_api_key_here

# EasyOCR Fallback (Optional - requires Python setup)
USE_EASYOCR_FALLBACK=false

# OCR Configuration
OCR_CONFIDENCE_THRESHOLD=0.7
ENABLE_AI_VALIDATION=true
```

## Getting API Keys

### Google Vision API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Vision API**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **API Key**
6. Copy the API key and add it to your `.env` file

**Note**: Google Vision API has a free tier with 1,000 requests per month.

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Get API Key**
3. Create a new API key or use an existing one
4. Copy the API key and add it to your `.env` file

**Note**: Gemini API has a generous free tier.

## Optional: EasyOCR Setup (Offline Fallback)

If you want to enable EasyOCR as an offline fallback:

1. Install Python 3.8 or higher
2. Install EasyOCR:
   ```bash
   pip install easyocr
   ```
3. Set `USE_EASYOCR_FALLBACK=true` in your `.env` file

**Note**: EasyOCR downloads language models (~100MB) on first use.

## Features

### Dual-Engine OCR
- **Primary**: Google Vision API (high accuracy, cloud-based)
- **Fallback**: EasyOCR (offline, Python-based)

### AI Validation
- Gemini AI validates and corrects OCR text
- Improves accuracy for ambiguous or unclear text
- Context-aware medicine name identification

### Structured Data Extraction
Automatically extracts:
- Medicine name (brand and generic)
- Dosage information
- Expiry date
- Batch number
- Manufacturer name
- Scan type (label, handwritten prescription, printed prescription)

### Auto-Detection
- Automatically detects scan type
- Manual override available if needed
- Confidence scoring for all extracted data

## Testing

To test the OCR system:

1. Make sure you have added the API keys to `.env`
2. Restart the backend server
3. Use the medicine scanner in the app
4. Upload a medicine label or prescription image
5. Check the console logs for OCR engine used and confidence scores

## Troubleshooting

### "OCR service is not configured"
- Make sure `GOOGLE_VISION_API_KEY` is set in `.env`
- Restart the backend server after adding the key

### "Vision API failed"
- Check if the API key is valid
- Verify that Cloud Vision API is enabled in Google Cloud Console
- Check if you have exceeded the free tier quota

### "EasyOCR not available"
- Make sure Python is installed
- Install EasyOCR: `pip install easyocr`
- Set `USE_EASYOCR_FALLBACK=true` in `.env`

## Cost Considerations

- **Google Vision API**: Free tier includes 1,000 requests/month, then $1.50 per 1,000 requests
- **Gemini API**: Generous free tier with rate limits
- **EasyOCR**: Completely free (offline processing)

For production use, consider:
- Implementing request caching
- Using EasyOCR as primary for cost savings
- Monitoring API usage in Google Cloud Console
