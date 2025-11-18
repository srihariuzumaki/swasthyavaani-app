import express from 'express';
import { body } from 'express-validator';
import FormData from 'form-data';
import { validateRequest } from '../utils/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const LANGUAGE_CODE_MAP = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'bn': 'bn-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
};

// @route   POST /api/voice/speech-to-text
// @desc    Convert speech to text using Sarvam API
// @access  Private (for demo, can be public)
router.post('/speech-to-text', [
  body('audio')
    .notEmpty()
    .withMessage('Audio data is required'),
  body('language')
    .optional()
    .isString()
    .withMessage('Language must be a string'),
], validateRequest, async (req, res, next) => {
  try {
    const { audio, language = 'en-IN', format } = req.body;
    const apiKey = process.env.SARVAM_API_KEY;

    // Simple mock texts used for demo / fallback
    const mockTexts = {
      'en-IN': 'paracetamol',
      'hi-IN': 'पैरासिटामोल',
      'ta-IN': 'பாராசிட்டமோல்',
      'te-IN': 'పారాసిటామోల్',
    };

    // If no API key, always return mock text (pure demo mode)
    if (!apiKey) {
      return res.status(200).json({
        status: 'success',
        text: mockTexts[language] || mockTexts['en-IN'],
        language,
        note: 'Demo mode - using mock response. Add SARVAM_API_KEY to .env for real API integration.',
      });
    }

    // Try real Sarvam API, but gracefully fall back to mock on any failure
    try {
      const normalizedLanguage = LANGUAGE_CODE_MAP[language] || language || 'en-IN';
      const inputFormat = (format || 'aac').toLowerCase();
      const contentType = inputFormat.includes('/') ? inputFormat : `audio/${inputFormat}`;
      const fileName = `audio.${inputFormat.replace(/[^a-z0-9]/gi, '') || 'aac'}`;

      const audioBuffer = Buffer.from(audio, 'base64');
      const formData = new FormData();
      formData.append('model', 'saarika:v2.5');
      formData.append('language_code', normalizedLanguage);
      formData.append('file', audioBuffer, {
        filename: fileName,
        contentType,
      });
      const formBuffer = formData.getBuffer();
      const formHeaders = formData.getHeaders();
      const contentLength = formBuffer.length;

      const sarvamResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          ...formHeaders,
          'Content-Length': contentLength.toString(),
        },
        body: formBuffer,
      });

      if (!sarvamResponse.ok) {
        const errorText = await sarvamResponse.text().catch(() => '');
        throw new Error(`Sarvam API request failed with status ${sarvamResponse.status}: ${errorText}`);
      }

      const sarvamData = await sarvamResponse.json();

      return res.status(200).json({
        status: 'success',
        text: sarvamData.transcript || sarvamData.text || '',
        language: sarvamData.language_code || normalizedLanguage,
      });
    } catch (sarvamError) {
      console.error('Sarvam API failed, falling back to mock text:', sarvamError);
      return res.status(200).json({
        status: 'success',
        text: mockTexts[language] || mockTexts['en-IN'],
        language,
        note: 'Sarvam API error - using demo fallback transcription.',
      });
    }
  } catch (error) {
    console.error('Error in speech-to-text:', error);
    next(error);
  }
});

// @route   POST /api/voice/text-to-speech
// @desc    Convert text to speech using Sarvam API
// @access  Private (for demo, can be public)
router.post('/text-to-speech', [
  body('text')
    .notEmpty()
    .withMessage('Text is required'),
  body('language')
    .optional()
    .isString()
    .withMessage('Language must be a string'),
], validateRequest, async (req, res, next) => {
  try {
    const { text, language = 'en-IN' } = req.body;
    const apiKey = process.env.SARVAM_API_KEY;

    // For demo purposes - if no API key, return mock audio
    if (!apiKey) {
      // Return a simple text response indicating demo mode
      // In production, you'd return actual audio
      return res.status(200).json({
        status: 'success',
        message: 'Demo mode - TTS would play audio here',
        text,
        language,
        note: 'Add SARVAM_API_KEY to .env for real TTS integration. For demo, using browser TTS fallback.',
      });
    }

    // Real Sarvam API integration
    const sarvamLang = SARVAM_LANGUAGE_MAP[language] || 'en';
    
    // Call Sarvam API (example endpoint - adjust based on actual API)
    const sarvamResponse = await fetch('https://api.sarvam.ai/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language: sarvamLang,
        voice: 'default', // Adjust based on available voices
      }),
    });

    if (!sarvamResponse.ok) {
      throw new Error('Sarvam API request failed');
    }

    const audioBuffer = await sarvamResponse.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    next(error);
  }
});

export default router;

