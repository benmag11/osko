# Google Analytics Integration

## Usage Example

### Tracking Custom Events

You can track custom events anywhere in your components:

```tsx
import { trackEvent } from '@/components/analytics'

// Example in a button click handler
<button
  onClick={() => {
    trackEvent('click', 'button', 'header-cta', 1)
  }}
>
  Get Started
</button>

// Example tracking form submission
const handleSubmit = async (data: FormData) => {
  // ... submit logic
  trackEvent('form_submit', 'engagement', 'contact_form')
}

// Example tracking subject selection
const handleSubjectSelect = (subject: string) => {
  trackEvent('select_subject', 'user_interaction', subject)
}
```

### Event Parameters

```typescript
trackEvent(
  action: string,      // The action being performed (e.g., 'click', 'submit')
  category: string,    // The category of the event (e.g., 'navigation', 'form')
  label?: string,      // Optional label for more detail
  value?: number       // Optional numeric value
)
```

### Common Event Examples

```tsx
// Track downloads
trackEvent('download', 'resource', 'exam-paper-2023')

// Track video plays
trackEvent('video_play', 'media', 'tutorial-intro')

// Track errors
trackEvent('error', 'system', 'payment_failed', 1)

// Track sign ups
trackEvent('sign_up', 'conversion', 'google_oauth')
```

## Automatic Tracking

The following are tracked automatically:
- Page views (on every route change)
- Session start
- First visit

## Testing

To verify Google Analytics is working:
1. Open your website in the browser
2. Open the Network tab in DevTools
3. Look for requests to `google-analytics.com` or `googletagmanager.com`
4. Check the Google Analytics Real-Time reports at https://analytics.google.com