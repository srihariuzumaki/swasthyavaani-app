import express from 'express';
import { body } from 'express-validator';
import FormData from 'form-data';
import { validateRequest } from '../utils/validation.js';
import { authenticate } from '../middleware/auth.js';
import { translateText } from '../utils/translator.js';

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

const DEFAULT_TTS_SPEAKERS = {
  'en-IN': 'anushka',
  'hi-IN': 'manisha',
  'bn-IN': 'vidya',
  'ta-IN': 'arya',
  'te-IN': 'abhilash',
  'kn-IN': 'karun',
  'ml-IN': 'hitesh',
  'mr-IN': 'manisha',
  'gu-IN': 'vidya',
  'pa-IN': 'abhilash',
  'od-IN': 'arya',
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
    const { text, language = 'en-IN', speaker } = req.body;
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

    const normalizedLanguage = LANGUAGE_CODE_MAP[language] || language || 'en-IN';
    const selectedSpeaker = speaker || DEFAULT_TTS_SPEAKERS[normalizedLanguage] || 'anushka';

    try {
      const sarvamResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model: 'bulbul:v2',
          target_language_code: normalizedLanguage,
          speaker: selectedSpeaker,
          audio_format: 'mp3',
        }),
      });

      if (!sarvamResponse.ok) {
        const errorText = await sarvamResponse.text().catch(() => '');
        throw new Error(`Sarvam TTS request failed with status ${sarvamResponse.status}: ${errorText}`);
      }

      const sarvamData = await sarvamResponse.json();
      const audioBase64 = sarvamData?.audios?.[0];

      if (!audioBase64) {
        throw new Error('Sarvam TTS response missing audio data');
      }

      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.byteLength);
      return res.status(200).send(audioBuffer);
    } catch (sarvamError) {
      console.error('Sarvam TTS failed, falling back to browser:', sarvamError);
      return res.status(200).json({
        status: 'success',
        message: 'Sarvam TTS unavailable. Falling back to browser speech.',
        text,
        language: normalizedLanguage,
        note: 'Sarvam TTS error - using browser SpeechSynthesis fallback.',
      });
    }
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    next(error);
  }
});

// @route   POST /api/voice/translate
// @desc    Translate arbitrary text to target language (default English)
router.post('/translate', [
  body('text')
    .notEmpty()
    .withMessage('Text is required'),
  body('targetLanguage')
    .optional()
    .isString()
    .withMessage('targetLanguage must be a string'),
], validateRequest, async (req, res, next) => {
  try {
    const { text, targetLanguage = 'en' } = req.body;
    const translatedText = await translateText(text, targetLanguage);

    res.json({
      status: 'success',
      data: {
        text: translatedText,
        targetLanguage,
      },
    });
  } catch (error) {
    console.error('Error translating text:', error);
    next(error);
  }
});

export default router;

