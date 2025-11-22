#!/usr/bin/env python3
"""
EasyOCR Python script for text extraction
This script is called from Node.js to perform OCR using EasyOCR
"""

import sys
import json
import base64
import argparse
import numpy as np
from PIL import Image
from io import BytesIO

try:
    import easyocr
except ImportError:
    print(json.dumps({"error": "EasyOCR not installed. Install with: pip install easyocr"}))
    sys.exit(1)

def extract_text(image_base64, languages=['en']):
    """
    Extract text from base64 encoded image using EasyOCR
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        
        # Convert to numpy array
        image_np = np.array(image)
        
        # Initialize EasyOCR reader
        reader = easyocr.Reader(languages, gpu=False)  # Set gpu=True if CUDA is available
        
        # Perform OCR
        results = reader.readtext(image_np)
        
        # Combine all detected text
        full_text = ' '.join([detection[1] for detection in results])
        
        # Calculate average confidence
        if results:
            avg_confidence = sum([detection[2] for detection in results]) / len(results)
        else:
            avg_confidence = 0.0
        
        return {
            "text": full_text,
            "confidence": avg_confidence,
            "detections": len(results)
        }
    except Exception as e:
        return {
            "error": str(e),
            "text": "",
            "confidence": 0.0
        }

def main():
    parser = argparse.ArgumentParser(description='EasyOCR text extraction')
    parser.add_argument('--languages', type=str, default='en', help='Comma-separated language codes')
    parser.add_argument('--image', type=str, required=True, help='Base64 encoded image')
    
    args = parser.parse_args()
    
    languages = args.languages.split(',')
    result = extract_text(args.image, languages)
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
