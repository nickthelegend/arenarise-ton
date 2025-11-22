# Telegram Mini App Integration

## Overview
ArenaRise is now integrated with Telegram Web App, allowing users to play directly within Telegram.

## Features Implemented

### 1. TON Connect Manifest
- Updated `public/tonconnect-manifest.json` with production URL: `https://arenarise.nickthelegend.tech`
- Configured for Telegram Mini App compatibility

### 2. Telegram Provider
- Created `components/telegram-provider.tsx` to manage Telegram user data
- Provides `useTelegram()` hook for accessing:
  - `user` - Telegram user information (id, username, first_name, etc.)
  - `webApp` - Telegram WebApp instance
  - `isInTelegram` - Boolean indicating if app is running in Telegram

### 3. User Profile Display
- **Navbar**: Shows Telegram username and premium badge (desktop view)
- **Home Page**: Welcome card with user profile when opened in Telegram
- Displays:
  - User's first name
  - Username (if available)
  - Premium badge (if user has Telegram Premium)

### 4. Telegram Web App Script
- Automatically loaded in `app/layout.tsx`
- Initializes and expands the app when opened in Telegram
- Adapts to Telegram's color scheme (dark/light mode)

## Usage

### Accessing Telegram User Data
```typescript
import { useTelegram } from '@/components/telegram-provider'

function MyComponent() {
  const { user, isInTelegram, webApp } = useTelegram()
  
  if (isInTelegram && user) {
    console.log('Telegram User:', user.username)
    console.log('Is Premium:', user.is_premium)
  }
  
  return (
    <div>
      {isInTelegram && user && (
        <p>Welcome, {user.first_name}!</p>
      )}
    </div>
  )
}
```

### Available User Properties
- `id` - Telegram user ID
- `first_name` - User's first name
- `last_name` - User's last name (optional)
- `username` - Telegram username (optional)
- `language_code` - User's language code
- `photo_url` - Profile photo URL (optional)
- `is_premium` - Premium status (optional)

## Setting Up Telegram Bot

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Set up the Mini App:
   ```
   /newapp
   Select your bot
   Enter app title: ArenaRise
   Enter app description: Create beasts, battle in the arena, and earn $RISE tokens
   Upload app icon (512x512 PNG)
   Enter web app URL: https://arenarise.nickthelegend.tech
   ```

3. Update `app/layout.tsx` with your bot username:
   ```typescript
   actionsConfiguration={{
     twaReturnUrl: 'https://t.me/YOUR_BOT_USERNAME'
   }}
   ```

## Testing

### Local Testing
1. Use [ngrok](https://ngrok.com/) to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update the manifest URL temporarily to your ngrok URL

3. Test in Telegram Web or Desktop app

### Production Testing
1. Deploy to production
2. Open your bot in Telegram
3. Launch the Mini App

## TypeScript Support
Type definitions for Telegram Web App are available in `types/telegram.d.ts`

## Notes
- The app automatically detects if it's running in Telegram
- Features gracefully degrade when not in Telegram
- User profile is only shown when accessed through Telegram
- TON Connect wallet integration works seamlessly in both web and Telegram environments
