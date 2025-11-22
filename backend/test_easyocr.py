"""
Test if EasyOCR works without scikit-image
"""
import sys

# Try to import EasyOCR
try:
    import easyocr
    print("✅ EasyOCR imported successfully!")
    
    # Try to create a reader
    try:
        reader = easyocr.Reader(['en'], gpu=False)
        print("✅ EasyOCR Reader created successfully!")
        print("✅ EasyOCR is ready to use!")
    except Exception as e:
        print(f"❌ Error creating EasyOCR Reader: {e}")
        print("\nThis might be due to missing scikit-image.")
        print("EasyOCR may still work for basic OCR tasks.")
        
except ImportError as e:
    print(f"❌ Cannot import EasyOCR: {e}")
    print("\nMissing dependencies:")
    print(str(e))
