# Telegram WebApp Native Integration

Complete implementation of Telegram WebApp native features including gestures, buttons, haptic feedback, and more.

## ✅ Implemented Features

### 1. **BackButton Integration**
- **Hook**: `useTelegramBackButton`
- **Auto-navigation**: Automatically navigates back or to fallback path
- **Smart visibility**: Shows on sub-pages, hides on main pages (`/`, `/wallet`, `/missions`, `/settings`, `/admin`)
- **Custom handlers**: Supports custom onClick handlers
- **Integrated on**:
  - ✅ All admin sub-pages (shows back button)
  - ✅ Main pages (hides back button automatically)

### 2. **MainButton Integration**
- **Hook**: `useTelegramMainButton`
- **Dynamic visibility**: Shows/hides based on state
- **Progress indicators**: Supports loading states
- **Customizable**: Text, colors, active/inactive states
- **Integrated on**:
  - ✅ WalletPage: Shows when amount is entered for top-up

### 3. **Haptic Feedback**
- **Functions**: `hapticImpact()`, `hapticNotification()`, `hapticSelection()`
- **Integrated on**:
  - ✅ Button clicks (selection feedback)
  - ✅ Form submissions (impact feedback)
  - ✅ Success/error notifications
  - ✅ Navigation (BottomNav)
  - ✅ Copy to clipboard actions
  - ✅ Transaction checks

### 4. **Pull-to-Refresh**
- **Component**: `TelegramPullToRefresh`
- **Features**:
  - Native-style pull gesture
  - Haptic feedback on threshold
  - Visual progress indicator
  - Smooth animations
- **Integrated on**:
  - ✅ WalletPage

### 5. **Theme Integration**
- **Hook**: `useTelegramTheme`
- **Features**:
  - Auto-applies Telegram theme colors
  - CSS variable mapping
  - Light/dark mode support
  - Theme change listeners
- **Applied**: Globally in App.tsx

### 6. **Viewport Handling**
- **Hook**: `useTelegramViewport`
- **Features**:
  - Auto-expands app to full height
  - Viewport change listeners
  - Height tracking
- **Applied**: Globally in App.tsx

### 7. **Closing Confirmation**
- **Hook**: `useTelegramClosingConfirmation`
- **Features**:
  - Enable/disable based on state
  - Prevents accidental app closure
- **Integrated on**:
  - ✅ SettingsPage: Enabled when forms have unsaved changes

### 8. **Telegram Button Component**
- **Component**: `TelegramButton`
- **Features**:
  - Applies Telegram theme colors
  - Haptic feedback on press
  - Drop-in replacement for regular Button
- **Used on**:
  - ✅ WalletPage: Top-up and withdraw buttons
  - ✅ SettingsPage: Update buttons

## 📁 File Structure

```
src/
├── hooks/
│   ├── useTelegramApp.ts              # Main Telegram initialization
│   ├── useTelegramBackButton.ts       # BackButton hook
│   ├── useTelegramMainButton.ts       # MainButton hook
│   ├── useTelegramTheme.ts            # Theme integration
│   ├── useTelegramViewport.ts         # Viewport handling
│   └── useTelegramClosingConfirmation.ts # Closing confirmation
├── components/
│   ├── TelegramButton.tsx             # Telegram-styled button
│   ├── TelegramPullToRefresh.tsx      # Pull-to-refresh component
│   └── ErrorBoundary.tsx              # Error boundary for crashes
└── lib/
    └── telegram.ts                    # Telegram utilities & types
```

## 🎯 Usage Examples

### BackButton
```tsx
// On main page (hide)
useTelegramBackButton({ isVisible: false });

// On sub-page (show, auto-navigate)
useTelegramBackButton();

// Custom navigation
useTelegramBackButton({
  onClick: () => navigate('/custom'),
});
```

### MainButton
```tsx
const { show, hide, setText } = useTelegramMainButton({
  text: 'Submit',
  onClick: handleSubmit,
  isVisible: hasData,
  isActive: !isLoading,
});
```

### Haptic Feedback
```tsx
// Selection feedback (taps, selections)
hapticSelection();

// Impact feedback (button presses)
hapticImpact('medium');

// Notifications (success/error)
hapticNotification('success');
hapticNotification('error');
```

### Pull-to-Refresh
```tsx
<TelegramPullToRefresh onRefresh={async () => {
  await refetchData();
}}>
  <YourContent />
</TelegramPullToRefresh>
```

### Closing Confirmation
```tsx
// Enable when form has unsaved changes
const hasUnsavedChanges = newValue !== originalValue;
useTelegramClosingConfirmation({ enabled: hasUnsavedChanges });
```

## 🔧 Configuration

### Main Pages (BackButton Hidden)
- `/` (HomePage)
- `/wallet` (WalletPage)
- `/missions` (ConfigsPage)
- `/settings` (SettingsPage)
- `/admin` (AdminPage)

### Sub-Pages (BackButton Shown)
- `/admin/users` (AdminUsersPage)
- `/admin/user/:id` (AdminUserDetailPage)
- `/admin/withdrawals/pending` (AdminPendingWithdrawalsPage)
- `/admin/transactions` (AdminTransactionsPage)
- `/admin/deposits` (AdminDepositsPage)

## 🛡️ Safety Features

1. **Rules of Hooks Compliance**: All hooks always return the same structure
2. **Error Handling**: Try-catch blocks around all Telegram API calls
3. **No-Op Functions**: Safe fallbacks when Telegram WebApp is unavailable
4. **Error Boundary**: Catches and displays errors gracefully
5. **Type Safety**: Full TypeScript support

## 🎨 Theme Integration

Telegram theme colors are automatically applied via CSS variables:
- `--tg-theme-bg-color`
- `--tg-theme-text-color`
- `--tg-theme-button-color`
- `--tg-theme-button-text-color`
- And more...

## 📱 Native Features

- ✅ BackButton with auto-navigation
- ✅ MainButton with dynamic states
- ✅ Haptic feedback (impact, notification, selection)
- ✅ Pull-to-refresh gesture
- ✅ Theme color integration
- ✅ Viewport expansion
- ✅ Closing confirmation
- ✅ Native button styling

## 🚀 Next Steps (Optional Enhancements)

- [ ] Add swipe gestures for navigation
- [ ] Implement Telegram's popup dialogs
- [ ] Add QR code scanning support
- [ ] Implement clipboard read/write
- [ ] Add Telegram link opening
