# Telegram Mini Apps Refactoring - Complete Implementation

This document outlines the comprehensive refactoring of the app to follow Telegram Mini Apps best practices based on the official documentation.

## Overview

The app has been refactored to:
1. ✅ Use proper Telegram Mini Apps SDK methods
2. ✅ Implement safe referral registration system
3. ✅ Handle transaction callbacks properly
4. ✅ Support gestures and back swipe reactions
5. ✅ Open payment gateway in new tab (keeps Mini App open)
6. ✅ Add proper event handling and error management

## Key Improvements

### 1. Telegram Mini Apps SDK (`src/lib/telegram-sdk.ts`)

**Cross-platform support:**
- ✅ Web: Uses `window.parent.postMessage` with secure origin
- ✅ Desktop/Mobile: Uses `TelegramWebviewProxy.postEvent`
- ✅ Windows Phone: Uses `window.external.notify`

**Key Features:**
- Type-safe method calls
- Automatic platform detection
- Secure origin validation
- Comprehensive error handling

**Methods Implemented:**
- `iframeReady()` - Notify parent iframe is ready
- `close()` - Close Mini App
- `expand()` - Expand to full height
- `openLink()` / `openLinkInNewTab()` - Open links in browser (keeps Mini App open)
- `setupBackButton()` - Control back button visibility
- `triggerHapticFeedback()` - Haptic feedback
- `setupMainButton()` - Control main button
- `setupClosingBehavior()` - Control closing confirmation
- `setupSwipeBehavior()` - Enable/disable swipe gestures
- `sendData()` - Send data to bot
- `showPopup()` / `showAlert()` / `showConfirm()` - UI dialogs
- `setHeaderColor()` / `setBackgroundColor()` - Theme customization

### 2. Event Manager (`src/lib/telegram-sdk.ts`)

**Event System:**
- Singleton `TelegramEventManager` instance
- Secure message handling with origin validation
- Support for all Telegram Mini Apps events:
  - `back_button_pressed`
  - `main_button_pressed`
  - `viewport_changed`
  - `theme_changed`
  - `popup_closed`
  - And more...

### 3. Referral Registration System (`src/hooks/useReferralRegistration.ts`)

**Safety Features:**
- ✅ Code format validation (alphanumeric, 3-20 chars)
- ✅ Duplicate processing prevention
- ✅ Only processes for new users (backend validation)
- ✅ Silent error handling (doesn't block app)
- ✅ Haptic feedback on success
- ✅ Supports both `start_param` and `?ref=CODE` query params

**Flow:**
1. User clicks referral link
2. Hook detects code from start_param or query param
3. Validates code format
4. Calls `syncUser` with referral_code
5. Backend only processes for new users
6. Success feedback provided

### 4. Transaction Callback Handler (`src/hooks/useTransactionCallback.ts`)

**Features:**
- ✅ Handles payment callbacks from Direct Links: `?payment=callback&tx=ORDERID`
- ✅ Handles start parameter redirects: `payment_tx_ORDERID`
- ✅ Prevents duplicate processing
- ✅ Navigates to wallet page with transaction info
- ✅ Provides haptic feedback

### 5. Payment Gateway Integration

**Improvements:**
- ✅ Uses `TelegramSDK.openLinkInNewTab()` instead of `window.location.href`
- ✅ Keeps Mini App open while user completes payment
- ✅ User can return to app after payment
- ✅ Fallback to direct API if SDK not available
- ✅ Proper error handling

**Before:**
```typescript
window.location.href = result.invoice_url; // Closes Mini App
```

**After:**
```typescript
TelegramSDK.openLinkInNewTab(result.invoice_url); // Opens in new tab, keeps Mini App open
```

### 6. Gesture and Swipe Behavior

**Hooks:**
- `useTelegramSwipeBehavior()` - Enable/disable swipe gestures
- `useTelegramClosingBehavior()` - Control closing confirmation
- `useTelegramEvents()` - Handle all Telegram events

**Usage:**
```typescript
// Enable swipe gestures
useTelegramSwipeBehavior(true);

// Require confirmation before closing
useTelegramClosingBehavior(true);

// Handle events
useTelegramEvents(); // Handles back button, viewport, theme changes
```

### 7. Back Button Handling

**Improvements:**
- ✅ Proper event listener setup
- ✅ Navigation handling
- ✅ Cleanup on unmount
- ✅ Fallback to home page if no history

### 8. Haptic Feedback

**Enhanced:**
- ✅ Type-safe haptic feedback calls
- ✅ Error handling (silent failures)
- ✅ Used throughout the app for better UX

## File Structure

```
src/
├── lib/
│   ├── telegram-sdk.ts          # Core SDK wrapper
│   └── telegram.ts               # Updated with SDK integration
├── hooks/
│   ├── useReferralRegistration.ts    # Safe referral handling
│   ├── useTransactionCallback.ts     # Payment callback handling
│   ├── useTelegramEvents.ts          # Event handling
│   ├── useTelegramSwipeBehavior.ts   # Swipe gesture control
│   └── useTelegramClosingBehavior.ts # Closing behavior control
└── App.tsx                       # Updated with all hooks
```

## Usage Examples

### Opening Payment Gateway

```typescript
import { TelegramSDK } from '@/lib/telegram-sdk';

// Opens in new tab, keeps Mini App open
TelegramSDK.openLinkInNewTab(paymentUrl);
```

### Handling Referral Codes

```typescript
// Automatically handled by useReferralRegistration hook
// No manual code needed - just use the hook in App.tsx
useReferralRegistration();
```

### Handling Transaction Callbacks

```typescript
// Automatically handled by useTransactionCallback hook
// Processes ?payment=callback&tx=ORDERID and payment_tx_ORDERID
useTransactionCallback();
```

### Event Handling

```typescript
import { telegramEvents } from '@/lib/telegram-sdk';

// Subscribe to events
const unsubscribe = telegramEvents.on('back_button_pressed', () => {
  // Handle back button
});

// Cleanup
unsubscribe();
```

## Security Improvements

1. **Origin Validation**: All message events verify origin
2. **Code Validation**: Referral codes are validated before processing
3. **Duplicate Prevention**: Refs prevent duplicate processing
4. **Error Handling**: Silent failures don't expose errors to users
5. **Backend Validation**: Server-side validation for referral codes

## Best Practices Implemented

1. ✅ Cross-platform compatibility (Web, Desktop, Mobile, Windows Phone)
2. ✅ Type safety with TypeScript
3. ✅ Error handling and fallbacks
4. ✅ Security (origin validation, code validation)
5. ✅ User experience (haptic feedback, proper navigation)
6. ✅ Code organization (dedicated hooks, clear separation of concerns)
7. ✅ Documentation (inline comments, this document)

## Testing Checklist

- [ ] Referral links work from start_param
- [ ] Referral links work from ?ref=CODE query param
- [ ] Payment gateway opens in new tab
- [ ] Mini App stays open during payment
- [ ] Transaction callbacks work correctly
- [ ] Back button navigation works
- [ ] Swipe gestures work
- [ ] Haptic feedback works
- [ ] Events are properly handled
- [ ] Error cases are handled gracefully

## References

- [Telegram Mini Apps Methods](https://docs.telegram-mini-apps.com/platform/methods)
- [Telegram Mini Apps Events](https://docs.telegram-mini-apps.com/platform/events)
- [Launch Parameters](https://docs.telegram-mini-apps.com/platform/launch-parameters)
- [Start Parameter](https://docs.telegram-mini-apps.com/platform/start-parameter)
- [Init Data](https://docs.telegram-mini-apps.com/platform/init-data)
- [Popup](https://docs.telegram-mini-apps.com/platform/popup)
