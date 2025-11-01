# Twilio Account Upgrade Guide

## Problem
With Twilio's free trial account, you can only send SMS to **verified phone numbers**. To send OTPs to any phone number, you need to upgrade your Twilio account.

## Solution: Upgrade to Paid Account

### Step 1: Log into Twilio Console
1. Go to [https://www.twilio.com/console](https://www.twilio.com/console)
2. Log in with your Twilio account

### Step 2: Upgrade Your Account
1. Click on your **account name** in the top right
2. Select **"Account"** from the dropdown
3. Look for the **"Trial Account"** section or **"Upgrade Account"** option
4. Click **"Upgrade Account"** or **"Upgrade"**

### Step 3: Add Payment Information
1. You'll be prompted to add a payment method (credit card)
2. Twilio uses a **pay-as-you-go** model:
   - No monthly fees
   - Pay only for what you use
   - SMS pricing varies by country (~$0.0075 per SMS in US)
   - See pricing: [https://www.twilio.com/sms/pricing](https://www.twilio.com/sms/pricing)

### Step 4: Verify Your Phone Number (Optional but Recommended)
1. In Twilio Console, go to **"Phone Numbers"** > **"Manage"** > **"Verified Caller IDs"**
2. Add and verify your phone number for testing
3. This helps during development

### Step 5: Get a Twilio Phone Number (Required for Production)
1. Go to **"Phone Numbers"** > **"Manage"** > **"Buy a Number"**
2. Select your country and area code
3. Choose a number that supports SMS
4. Click **"Buy"** (most numbers are $1/month)

### Step 6: Update Environment Variables
Update your `.env` file or Vercel environment variables:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your purchased Twilio number (with country code)
```

**Important:** 
- The `TWILIO_PHONE_NUMBER` must be in E.164 format: `+[country code][number]`
- Example: `+15551234567` (US), `+919876543210` (India)

### Step 7: Test
1. Restart your backend server
2. Try sending an OTP to any phone number
3. It should work now! ✅

## Alternative: Use Twilio Trial Without Upgrade (Limited)
If you can't upgrade right now:
- You can add up to **10 verified numbers** in Twilio Console
- Go to **"Phone Numbers"** > **"Verified Caller IDs"** 
- Add phone numbers you want to test with
- This is not practical for production, but works for development/testing

## Pricing Notes
- **SMS Cost**: ~$0.0075 per SMS in US (varies by country)
- **Phone Number**: ~$1/month per number
- **No Setup Fees**: Only pay for what you use
- **Free Credits**: Some accounts get $15+ free credits when upgrading

## Troubleshooting

### Error: "Unable to create record: The number +XXXXXXXX is unverified"
- **Solution**: Upgrade your account or verify the number in Twilio Console

### Error: "The number +XXXXXXXX is not a valid mobile number"
- **Solution**: Make sure the number includes country code and is in E.164 format

### Error: "Permission to send an SMS has not been enabled"
- **Solution**: Complete phone number verification in Twilio Console

## Need Help?
- Twilio Support: [https://support.twilio.com](https://support.twilio.com)
- Twilio Docs: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- SMS Troubleshooting: [https://support.twilio.com/hc/en-us/articles/223181268-Troubleshooting-Unable-to-Create-Record-The-From-phone-number-XXXXXX-is-not-a-valid-SMS-capable-phone-number](https://support.twilio.com/hc/en-us/articles/223181268-Troubleshooting-Unable-to-Create-Record-The-From-phone-number-XXXXXX-is-not-a-valid-SMS-capable-phone-number)

