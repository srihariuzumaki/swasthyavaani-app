# Python OCR Microservice

Flask-based OCR microservice using EasyOCR for medicine label text extraction.

## Features

- ✅ EasyOCR with multi-language support (English, Hindi, etc.)
- ✅ Image preprocessing (grayscale, denoising, contrast enhancement)
- ✅ REST API with JSON responses
- ✅ CORS support for Vercel backend
- ✅ Health check endpoint
- ✅ Deployed on Railway.app (FREE)

## API Endpoints

### Health Check
```
GET /health
```

### Extract Text from Image
```
POST /ocr/extract

Request Body:
{
  "image": "base64_encoded_image_string",
  "languages": ["en", "hi"],  // optional, default: ["en", "hi"]
  "preprocess": true,          // optional, default: true
  "scanType": "label"          // optional
}

Response:
{
  "success": true,
  "data": {
    "text": "DOLO 650 Paracetamol",
    "confidence": 0.87,
    "blocks": [
      {
        "text": "DOLO 650",
        "confidence": 0.92,
        "bbox": [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
      }
    ],
    "engine": "easyocr",
    "languages": ["en", "hi"],
    "preprocessed": true
  }
}
```

## Local Development

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python app.py
```

3. **Test the API:**
```bash
curl -X POST http://localhost:5000/ocr/extract \
  -H "Content-Type: application/json" \
  -d '{"image":"base64_string_here"}'
```

## Deploy to Railway

### Method 1: Railway CLI

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login:**
```bash
railway login
```

3. **Initialize project:**
```bash
cd ocr-service
railway init
```

4. **Deploy:**
```bash
railway up
```

5. **Get URL:**
```bash
railway domain
```

### Method 2: GitHub Integration (Recommended)

1. **Push code to GitHub:**
```bash
git add ocr-service/
git commit -m "Add Python OCR microservice"
git push
```

2. **Create Railway project:**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory: `ocr-service`

3. **Configure:**
   - Railway auto-detects Python
   - Set environment variables in Railway dashboard:
     - `ALLOWED_ORIGINS`: Your Vercel backend URL
     - `PORT`: 5000 (auto-set by Railway)

4. **Deploy:**
   - Railway automatically deploys
   - Get your service URL from Railway dashboard

## Environment Variables

Set these in Railway dashboard:

- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (your Vercel backend URL)
- `PORT`: Auto-set by Railway (usually 5000)
- `FLASK_ENV`: `production`

## Testing

Test the deployed service:

```bash
curl https://your-service.railway.app/health
```

## Integration with Node.js Backend

Update your Node.js backend to call this service:

```javascript
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL;

async function extractText(imageBase64) {
  const response = await fetch(`${OCR_SERVICE_URL}/ocr/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      languages: ['en', 'hi'],
      preprocess: true
    })
  });
  
  return await response.json();
}
```

## Cost

- **Railway FREE tier:** $5 credit/month
- **Estimated usage:** ~$2-3/month for small apps
- **Completely FREE** for hobby projects

## Troubleshooting

### EasyOCR model download
First request will be slow (~30s) as EasyOCR downloads language models. Subsequent requests are fast.

### Memory issues
Railway free tier has 512MB RAM. If you get memory errors:
- Reduce concurrent requests
- Use fewer languages
- Upgrade to Railway Pro ($5/month)

### Cold starts
Railway doesn't have cold starts on free tier (unlike Render).

## Support

For issues, check:
- Railway logs: `railway logs`
- Flask logs in Railway dashboard
- Test locally first: `python app.py`
