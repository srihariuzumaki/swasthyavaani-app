"""
Python OCR Microservice
Flask API with EasyOCR for medicine label text extraction
Deploy to Railway.app
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import cv2
import numpy as np
import base64
import os
import logging
from io import BytesIO
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS - allow Vercel backend
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
CORS(app, origins=allowed_origins)

# Global EasyOCR reader (initialized once for performance)
reader = None

def get_reader(languages=['en', 'hi']):
    """Get or initialize EasyOCR reader"""
    global reader
    if reader is None:
        logger.info(f"Initializing EasyOCR with languages: {languages}")
        reader = easyocr.Reader(languages, gpu=False)
        logger.info("EasyOCR initialized successfully")
    return reader

def preprocess_image(image_array):
    """
    Preprocess image for better OCR accuracy
    """
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Enhance contrast using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(blurred)
        
        # Sharpen
        kernel = np.array([[-1,-1,-1],
                          [-1, 9,-1],
                          [-1,-1,-1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        
        return sharpened
    except Exception as e:
        logger.error(f"Preprocessing error: {e}")
        return image_array

def decode_base64_image(base64_string):
    """Decode base64 string to image array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        image = Image.open(BytesIO(image_data))
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_array
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        raise ValueError(f"Invalid image data: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'OCR Microservice',
        'version': '1.0.0'
    })

@app.route('/ocr/extract', methods=['POST'])
def extract_text():
    """
    Extract text from image using EasyOCR
    
    Request Body:
    {
        "image": "base64_encoded_image",
        "languages": ["en", "hi"],  # optional
        "preprocess": true,          # optional
        "scanType": "label"          # optional
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image data'
            }), 400
        
        # Extract parameters
        image_base64 = data['image']
        languages = data.get('languages', ['en', 'hi'])
        should_preprocess = data.get('preprocess', True)
        scan_type = data.get('scanType', 'label')
        
        logger.info(f"Processing OCR request - Languages: {languages}, Preprocess: {should_preprocess}")
        
        # Decode image
        image_array = decode_base64_image(image_base64)
        
        # Preprocess if requested
        if should_preprocess:
            image_array = preprocess_image(image_array)
        
        # Get EasyOCR reader
        ocr_reader = get_reader(languages)
        
        # Perform OCR
        results = ocr_reader.readtext(image_array)
        
        # Process results
        extracted_text = []
        blocks = []
        total_confidence = 0
        
        for (bbox, text, confidence) in results:
            extracted_text.append(text)
            blocks.append({
                'text': text,
                'confidence': float(confidence),
                'bbox': [[int(x), int(y)] for x, y in bbox]
            })
            total_confidence += confidence
        
        # Calculate average confidence
        avg_confidence = total_confidence / len(results) if results else 0
        
        # Combine text
        full_text = ' '.join(extracted_text)
        
        logger.info(f"OCR completed - Extracted {len(blocks)} blocks, avg confidence: {avg_confidence:.2f}")
        
        return jsonify({
            'success': True,
            'data': {
                'text': full_text,
                'confidence': float(avg_confidence),
                'blocks': blocks,
                'engine': 'easyocr',
                'languages': languages,
                'preprocessed': should_preprocess,
                'scanType': scan_type
            }
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"OCR processing error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'OCR processing failed',
            'details': str(e)
        }), 500

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'OCR Microservice',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'extract': '/ocr/extract (POST)'
        }
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
