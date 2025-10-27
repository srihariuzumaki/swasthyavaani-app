# Backend Fixes Applied

## Issues Fixed

### 1. ✅ Trust Proxy Error
- **Problem**: express-rate-limit was receiving X-Forwarded-For header but Express trust proxy was false
- **Solution**: Added `app.set('trust proxy', 1)` before rate limiting
- **File**: `backend/src/server.js` line 24

### 2. ✅ CORS Error
- **Problem**: Android mobile app requests were being blocked by CORS
- **Solution**: 
  - Simplified CORS to allow all origins (security handled by JWT authentication)
  - Configured helmet to not block CORS headers
  - Allows mobile apps (no origin header) and web apps
- **Files**: `backend/src/server.js` lines 30-49

## Key Changes

1. **Trust Proxy Configuration** (line 24)
   ```javascript
   app.set('trust proxy', 1);
   ```

2. **Helmet Configuration** (lines 30-34)
   ```javascript
   app.use(helmet({
       crossOriginEmbedderPolicy: false,
       crossOriginResourcePolicy: false,
       crossOriginOpenerPolicy: false,
   }));
   ```

3. **Rate Limiting** (lines 36-46)
   - Added standard headers configuration
   - Removed legacy headers

4. **CORS Configuration** (lines 48-52)
   - Allows all origins (`origin: true`)
   - Security is handled by JWT authentication
   - Added specific methods and headers
   - Simplified to avoid complex origin checking

## Deployment Instructions

### Option 1: Deploy via Git (Recommended)

If your backend is connected to Git and automatically deploys:

```bash
# Commit the changes
git add backend/src/server.js
git commit -m "Fix CORS and trust proxy for Vercel deployment"
git push origin main
```

Vercel will automatically deploy the changes.

### Option 2: Manual Deploy via Vercel CLI

```bash
cd backend
vercel --prod
```

### Option 3: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to Deployments
4. Click "Redeploy" on the latest deployment (or push changes to trigger a new deploy)

## Testing

After deployment, test the API:

```bash
# Test health endpoint
curl https://swasthyavaani-app.vercel.app/api/health

# Test from Android app
# The OTP sending should now work
```

## Environment Variables

Make sure these are set in Vercel Dashboard:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret
- `TWILIO_ACCOUNT_SID` - Twilio credentials (for OTP)
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `NODE_ENV` - Set to "production"

## After Deployment

1. Wait for deployment to complete (~1-2 minutes)
2. Test the Android app again
3. Check Vercel logs for any new errors
4. Send OTP should work now! 🎉

