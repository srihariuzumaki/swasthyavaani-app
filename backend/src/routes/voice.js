import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../utils/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Map language codes to Sarvam API format
const SARVAM_LANGUAGE_MAP = {
  'en-IN': 'en',
  'hi-IN': 'hi',
  'ta-IN': 'ta',
  'te-IN': 'te',
  'bn-IN': 'bn',
  'mr-IN': 'mr',
  'gu-IN': 'gu',
  'kn-IN': 'kn',
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
    const { audio, language = 'en-IN' } = req.body;
    const apiKey = process.env.SARVAM_API_KEY;

    // For demo purposes - if no API key, return mock response
    if (!apiKey) {
      // Mock response for demo
      const mockTexts = {
        'en-IN': 'paracetamol',
        'hi-IN': 'पैरासिटामोल',
        'ta-IN': 'பாராசிட்டமோல்',
        'te-IN': 'పారాసిటామోల్',
      };
      
      return res.status(200).json({
        status: 'success',
        text: mockTexts[language] || mockTexts['en-IN'],
        language,
        note: 'Demo mode - using mock response. Add SARVAM_API_KEY to .env for real API integration.',
      });
    }

    // Real Sarvam API integration
    // Note: This is a simplified example. Actual Sarvam API endpoints may differ
    const sarvamLang = SARVAM_LANGUAGE_MAP[language] || 'en';
    
    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Call Sarvam API (example endpoint - adjust based on actual API)
    const sarvamResponse = await fetch('https://api.sarvam.ai/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: audio,
        language: sarvamLang,
        format: 'webm',
      }),
    });

    if (!sarvamResponse.ok) {
      throw new Error('Sarvam API request failed');
    }

    const sarvamData = await sarvamResponse.json();
    
    res.status(200).json({
      status: 'success',
      text: sarvamData.text || sarvamData.transcript || '',
      language,
    });
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

