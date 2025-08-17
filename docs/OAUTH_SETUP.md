# OAuth Setup Guide for Google & Apple Sign In

This guide will walk you through setting up Google and Apple OAuth authentication for your website using Supabase Auth. This implementation uses the modern PKCE flow for maximum security.

## Prerequisites

- Supabase project (already configured ✓)
- Google Cloud Console account (free)
- Apple Developer account ($99/year - only needed for Apple Sign In)

## Implementation Overview

The OAuth implementation consists of:
1. **Server Actions** (`/app/auth/oauth-actions.ts`) - Handles OAuth flow initiation
2. **OAuth Buttons** (`/components/auth/oauth-buttons.tsx`) - Reusable button components
3. **Callback Handler** (`/app/auth/callback/route.ts`) - Processes OAuth responses
4. **Updated Forms** - Login and signup forms with integrated OAuth buttons

## Step 1: Google OAuth Setup

### 1.1 Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **+ CREATE CREDENTIALS > OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in app information (name, support email, etc.)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in development

### 1.2 Create OAuth 2.0 Client ID

1. Application type: **Web application**
2. Name: "Your App Name - Web"
3. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
4. Authorized redirect URIs:
   ```
   https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
   ```
5. Click **CREATE**
6. Copy the **Client ID** and **Client Secret**

### 1.3 Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Find **Google** and click **Enable**
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

## Step 2: Apple OAuth Setup

### 2.1 Apple Developer Account Setup

1. Go to [Apple Developer](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**

### 2.2 Create App ID

1. Go to **Identifiers** > Click **+**
2. Select **App IDs** > **Continue**
3. Select **App** > **Continue**
4. Fill in:
   - Description: "Your App Name"
   - Bundle ID: `com.yourcompany.yourapp` (reverse domain format)
5. Under Capabilities, check **Sign In with Apple**
6. Click **Continue** > **Register**

### 2.3 Create Services ID (for Web)

1. Go to **Identifiers** > Click **+**
2. Select **Services IDs** > **Continue**
3. Fill in:
   - Description: "Your App Name - Web"
   - Identifier: `com.yourcompany.yourapp.web`
4. Click **Continue** > **Register**
5. Click on the created Services ID
6. Check **Sign In with Apple** > **Configure**
7. Primary App ID: Select your App ID from step 2.2
8. Configure Website URLs:
   - Domains: `[YOUR-PROJECT-ID].supabase.co`
   - Return URLs: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
9. Click **Next** > **Done** > **Continue** > **Save**

### 2.4 Create Private Key

1. Go to **Keys** > Click **+**
2. Key Name: "Your App Auth Key"
3. Check **Sign In with Apple**
4. Click **Continue** > **Register**
5. **Download** the key file (you can only download once!)
6. Note the **Key ID** shown

### 2.5 Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Find **Apple** and click **Enable**
4. Fill in:
   - **Service ID**: From step 2.3 (e.g., `com.yourcompany.yourapp.web`)
   - **Team ID**: Found in Apple Developer account membership
   - **Key ID**: From step 2.4
   - **Private Key**: Contents of the downloaded .p8 file
5. Click **Save**

## Step 3: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication > URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3000/**
   https://your-production-domain.com/**
   ```
3. Ensure **Site URL** is set to your production domain

## Step 4: Test Your Implementation

### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to `/auth/signin` or `/auth/signup`
3. Click "Sign in with Google" or "Sign in with Apple"
4. Complete the OAuth flow
5. Verify redirect to dashboard after successful authentication

### Debugging Tips

1. **Check Browser Console**: Look for any JavaScript errors
2. **Check Network Tab**: Verify OAuth redirects are working
3. **Check Supabase Logs**: Dashboard > Logs > Auth logs
4. **Common Issues**:
   - Redirect URL mismatch: Ensure URLs match exactly in all configurations
   - Invalid client ID: Double-check credentials are copied correctly
   - CORS errors: Usually indicates URL configuration issues

## Step 5: Production Deployment

### Before Going Live

1. **Google OAuth**:
   - Move from test mode to production in OAuth consent screen
   - Add production domain to authorized origins and redirect URIs
   - Consider verification if requesting sensitive scopes

2. **Apple OAuth**:
   - No additional steps needed if Services ID is configured correctly

3. **Environment Variables**:
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - OAuth credentials are stored in Supabase, not in env variables

### Security Best Practices

1. **Never expose OAuth secrets** in client-side code
2. **Use PKCE flow** (already implemented ✓)
3. **Validate redirect URLs** (handled by Supabase ✓)
4. **Implement rate limiting** (Supabase handles this ✓)
5. **Monitor auth logs** regularly for suspicious activity

## Customization Options

### Customize Button Text

Edit `/components/auth/oauth-buttons.tsx` to change button labels:
```tsx
// Change "Sign in with Google" to something else
<OAuthButton ...>
  <GoogleIcon />
  Continue with Google  // Your custom text
</OAuthButton>
```

### Add Loading States

The implementation already includes loading states. Customize in the button components.

### Handle Errors

Error handling is implemented. Customize error messages in:
- `/components/auth/oauth-buttons.tsx` - Client-side errors
- `/app/auth/callback/route.ts` - Server-side errors

## Troubleshooting

### "Invalid client_id" Error
- Verify Client ID is correctly copied to Supabase
- Check you're using Web Client ID, not Android/iOS

### "Redirect URI mismatch" Error
- Ensure redirect URI exactly matches in provider console
- Include protocol (https://) and no trailing slash

### Apple Sign In Not Working
- Verify Services ID (not App ID) is used
- Check domain verification in Apple Developer Console
- Ensure private key is correctly formatted (including headers)

### Users Not Redirected After Sign In
- Check middleware.ts for proper routing logic
- Verify onboarding flow in callback route
- Check browser console for JavaScript errors

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Next.js Auth Best Practices](https://nextjs.org/docs/authentication)

## Next Steps

1. ✅ Test OAuth flow thoroughly
2. ✅ Configure production domains
3. ✅ Monitor authentication logs
4. Consider adding:
   - More OAuth providers (GitHub, Microsoft, etc.)
   - Two-factor authentication
   - Session management UI
   - Account linking for multiple auth methods