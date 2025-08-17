# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for your website using Supabase Auth with the modern PKCE flow for maximum security.

## Prerequisites

- Supabase project (already configured ✓)
- Google Cloud Console account (free)

## Implementation Overview

The OAuth implementation consists of:
1. **Server Actions** (`/app/auth/oauth-actions.ts`) - Handles OAuth flow initiation
2. **OAuth Buttons** (`/components/auth/oauth-buttons.tsx`) - Reusable button components
3. **Callback Handler** (`/app/auth/callback/route.ts`) - Processes OAuth responses
4. **Updated Forms** - Login and signup forms with integrated OAuth buttons

## Step 1: Google Cloud Console Configuration

### 1.1 Create or Select Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services > Credentials**

### 1.2 Configure OAuth Consent Screen

1. Go to **OAuth consent screen** in the sidebar
2. Choose **External** user type (for public applications)
3. Fill in application information:
   - App name: Your application name
   - User support email: Your email address
   - App logo (optional)
   - Application home page: Your website URL
   - Authorized domains: Add your production domain
   - Developer contact information: Your email address
4. Add scopes:
   - `email` - View email address
   - `profile` - View basic profile info
   - `openid` - Authenticate using OpenID Connect
5. Add test users if in development mode
6. Review and save

### 1.3 Create OAuth 2.0 Credentials

1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Application type: **Web application**
3. Name: "Your App Name - Web"
4. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
5. Authorized redirect URIs:
   ```
   https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
   ```
   > Replace `[YOUR-PROJECT-ID]` with your actual Supabase project ID
6. Click **CREATE**
7. Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

## Step 2: Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication > Providers**
4. Find **Google** in the list and click to expand
5. Toggle **Enable Google** to ON
6. Paste your **Client ID** from Google Cloud Console
7. Paste your **Client Secret** from Google Cloud Console
8. Click **Save**

## Step 3: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication > URL Configuration**
2. Set **Site URL** to your production domain:
   ```
   https://your-production-domain.com
   ```
3. Add to **Redirect URLs**:
   ```
   http://localhost:3000/**
   https://your-production-domain.com/**
   ```
   > The `/**` wildcard allows redirects to any path on your domain
4. Click **Save**

## Step 4: Test Your Implementation

### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to `/auth/signin` or `/auth/signup`
3. Click "Sign in with Google"
4. You should be redirected to Google's consent screen
5. After authorization, you'll be redirected back to your application
6. Verify you're logged in and redirected to the dashboard

### Testing Checklist

- [ ] Google button appears on login page
- [ ] Google button appears on signup page
- [ ] Clicking button redirects to Google
- [ ] Google consent screen shows correct app name
- [ ] After authorization, user returns to your app
- [ ] User session is created successfully
- [ ] User is redirected to dashboard/onboarding as appropriate

## Step 5: Production Deployment

### Before Going Live

1. **Google OAuth Console**:
   - Move from test mode to production in OAuth consent screen
   - Add your production domain to authorized JavaScript origins
   - Add production redirect URI if different from development
   - Consider getting your app verified by Google if requesting sensitive scopes

2. **Environment Variables**:
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
   - Note: OAuth credentials are stored in Supabase, not in env variables

3. **Monitoring**:
   - Check Supabase Dashboard > Logs > Auth logs regularly
   - Monitor for failed authentication attempts
   - Set up alerts for unusual activity

## Troubleshooting

### Common Issues and Solutions

#### "Invalid client_id" Error
- Verify Client ID is correctly copied to Supabase Dashboard
- Ensure you're using the Web Client ID, not Android/iOS
- Check for extra spaces when copying credentials

#### "Redirect URI mismatch" Error
- Ensure redirect URI in Google Console exactly matches Supabase's callback URL
- Include the protocol (`https://`) in the URI
- Don't include trailing slashes unless specified
- Format: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`

#### Users Not Redirected After Sign In
- Check `middleware.ts` for proper routing logic
- Verify onboarding flow in `/auth/callback/route.ts`
- Check browser console for JavaScript errors
- Ensure cookies are enabled in the browser

#### "Access blocked" Error
- App may still be in test mode in Google Console
- Add user's email to test users list
- Or publish app to production mode

### Debugging Tips

1. **Check Browser Console**: Look for any JavaScript errors or warnings
2. **Check Network Tab**: 
   - Verify OAuth redirect is happening
   - Check for failed API calls
3. **Check Supabase Logs**: 
   - Dashboard > Logs > Auth logs
   - Look for error messages or failed attempts
4. **Enable Debug Mode**: Add console.log statements in:
   - `/app/auth/oauth-actions.ts`
   - `/auth/callback/route.ts`
   - OAuth button components

## Security Best Practices

1. **Never expose OAuth secrets** in client-side code
2. **Use PKCE flow** (already implemented ✓)
3. **Validate redirect URLs** (handled by Supabase ✓)
4. **Implement rate limiting** (Supabase handles this ✓)
5. **Monitor auth logs** regularly for suspicious activity
6. **Keep dependencies updated** for security patches
7. **Use HTTPS** in production (required for OAuth)

## Customization Options

### Customize Button Text

Edit `/components/auth/oauth-buttons.tsx`:
```tsx
// Change button text
<OAuthButton ...>
  <GoogleIcon />
  Continue with Google  // Your custom text here
</OAuthButton>
```

### Customize Error Messages

Edit error messages in `/components/auth/oauth-buttons.tsx`:
```tsx
setError('Your custom error message here')
```

### Add Loading States

Loading states are already implemented. Customize the loading text:
```tsx
{pending ? 'Your loading text...' : children}
```

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/authentication)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## Next Steps

1. ✅ Test OAuth flow thoroughly in development
2. ✅ Configure production domains in Google Console
3. ✅ Deploy to production
4. ✅ Monitor authentication logs
5. Consider adding:
   - Additional OAuth providers (GitHub, Microsoft, etc.)
   - Two-factor authentication
   - Session management UI
   - Account linking for multiple auth methods
   - Custom email templates for better branding