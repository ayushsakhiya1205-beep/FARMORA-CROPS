# Email Service Setup Guide

## Gmail Configuration for OTP Sending

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification"

### Step 2: Generate App Password
1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. Select "Mail" for the app
3. Select "Other (Custom name)" and enter "Farmora Crops OTP"
4. Click "Generate"
5. Copy the 16-character password (this is your GMAIL_PASS)

### Step 3: Update .env File
Update your `.env` file with your credentials:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password
```

### Step 4: Test the Configuration
Restart the backend server. You should see:
- ✅ Email service is ready to send OTPs (if configured correctly)
- ⚠️ Email service not configured (if there are issues)

## Features

### What the Email Service Does:
- Sends beautifully formatted HTML emails to users
- Includes OTP code in a secure, professional template
- Automatically expires OTPs after 10 minutes
- Logs successful email deliveries
- Handles email service errors gracefully

### Email Template Features:
- Professional Farmora Crops branding
- Clear OTP display with large, readable font
- Security warnings and best practices
- Mobile-responsive design
- Expiration time information

## Testing

1. Start the backend server
2. Try to login with any user account
3. Check your email for the OTP
4. Enter the OTP in the verification screen

## Troubleshooting

### Common Issues:
1. **"Invalid login credentials"** - Enable 2FA and generate a new App Password
2. **"Email service not configured"** - Check your .env file values
3. **No email received** - Check spam folder, verify email address

### Debug Mode:
If email service fails, the system will:
- Show detailed error messages in console
- Return appropriate error responses to frontend
- Continue functioning with console OTP fallback

## Security Notes

- Never use your regular Gmail password
- Always use App Passwords for applications
- Keep your .env file secure and never commit to git
- The App Password gives access only to Gmail sending功能
