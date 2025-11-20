# ArenaRise - Setup Guide

## 🎮 Complete TON Connect + Supabase Integration

This guide covers the complete setup of ArenaRise with TON Connect wallet integration, Supabase database, and real-time PVP battles.

---

## 📦 Packages Installed

The following packages have been installed:

```bash
@tonconnect/ui-react @ton/ton @ton/core @ton/crypto @twa-dev/sdk @supabase/supabase-js
```

---

## 🗄️ Database Setup

### Step 1: Run the Schema SQL

1. Open your Supabase project at: https://doqnwztoitbdlfbenctb.supabase.co
2. Go to the SQL Editor
3. Copy and paste the entire content from `/app/schema.sql`
4. Execute the SQL script

This will create:
- ✅ `users` table (wallet addresses)
- ✅ `battles` table (PVP battle records)
- ✅ `battle_moves` table (real-time move tracking)
- ✅ `bets` table (betting system)
- ✅ `moves` table (predefined attack moves)
- ✅ 2 mock users with TON wallet addresses
- ✅ 2 mock beasts for testing
- ✅ Real-time subscriptions enabled

### Step 2: Enable Realtime

1. In Supabase Dashboard, go to **Database** → **Replication**
2. Enable replication for the `battle_moves` table
3. This allows real-time battle updates

---

## 🔌 TON Connect Configuration

### TON Manifest File

Location: `/app/public/tonconnect-manifest.json`

**For Production**, update the URLs in this file to your actual domain:

```json
{
  "url": "https://yourdomain.com",
  "name": "ArenaRise",
  "iconUrl": "https://yourdomain.com/icon.svg",
  "termsOfUseUrl": "https://yourdomain.com/terms",
  "privacyPolicyUrl": "https://yourdomain.com/privacy"
}
```

### Telegram Web App (TWA)

In `/app/app/layout.tsx`, update the `twaReturnUrl`:

```typescript
actionsConfiguration={{
  twaReturnUrl: 'https://t.me/your_bot_name'  // Replace with your Telegram bot
}}
```

---

## 🚀 Running the Application

### Development Mode

```bash
cd /app
yarn dev
```

The app will be available at: `http://localhost:3000`

### Production Build

```bash
yarn build
yarn start
```

---

## 🎯 Features Implemented

### 1. **TON Wallet Connection**
- Connect Wallet button at the top of the navbar
- Game UI only shows after wallet is connected
- User-friendly wallet address display
- Automatic user creation in database

### 2. **Supabase Integration**
- Complete REST API routes:
  - `/api/users` - User management
  - `/api/beasts` - Beast inventory
  - `/api/battles` - Battle creation and retrieval
  - `/api/battles/moves` - Battle move recording
  - `/api/moves` - Available moves list

### 3. **Real-Time PVP Battles**
- Turn-based combat system
- Real-time move synchronization via Supabase Realtime
- Dynamic damage calculation based on beast stats
- Battle log with move history
- Winner determination

### 4. **Mock Data for Testing**
Two mock users and beasts are pre-seeded:

**User 1:**
- Wallet: `0:1234567890abcdef...` (shortened)
- Beast: Fire Drake (Level 15, Fire type)

**User 2:**
- Wallet: `0:abcdef1234567890...` (shortened)
- Beast: Thunder Wolf (Level 12, Electric type)

---

## 🎮 How to Test PVP

### Option 1: Two Browsers (Recommended)

1. **Browser 1:**
   - Connect with first TON wallet
   - Go to `/battle` → PVP tab
   - Select Fire Drake
   - Click "Find Match"

2. **Browser 2:**
   - Connect with second TON wallet (different account)
   - The battle will auto-start with mock opponent
   - Take turns selecting moves

### Option 2: Quick Test Flow

1. Connect your TON wallet
2. Navigate to **Battle** → **PVP**
3. Select one of your beasts
4. Click **Find Match**
5. System auto-matches with mock opponent
6. Battle starts immediately in `/battle/arena/[id]`

---

## 🔧 API Endpoints

### Users
- `POST /api/users` - Create/get user by wallet address
- `GET /api/users?wallet_address=xxx` - Get user by wallet

### Beasts
- `GET /api/beasts?owner_address=xxx` - Get user's beasts

### Battles
- `POST /api/battles` - Create new battle
- `GET /api/battles?user_id=xxx` - Get user's battles
- `GET /api/battles?battle_id=xxx` - Get specific battle

### Battle Moves
- `POST /api/battles/moves` - Record a move
- `GET /api/battles/moves?battle_id=xxx` - Get battle moves

### Moves
- `GET /api/moves` - Get all available moves

---

## 🎲 Game Mechanics

### Damage Calculation

```javascript
baseDamage = move.damage
attackStat = attacker.attack
defenseStat = defender.defense
randomMultiplier = random(0.85 - 1.15)

finalDamage = baseDamage × (attackStat / (attackStat + defenseStat)) × randomMultiplier
```

### Turn System
- Player 1 always starts
- Turns alternate automatically after each move
- Battle ends when a beast's HP reaches 0
- Winner is recorded in database

### Moves Available
1. Fire Blast (35 DMG - Fire)
2. Thunder Strike (40 DMG - Electric)
3. Ice Shard (30 DMG - Ice)
4. Earthquake (45 DMG - Earth)
5. Wind Slash (25 DMG - Wind)
6. Poison Sting (20 DMG - Poison)
7. Shadow Claw (38 DMG - Dark)
8. Healing Light (-30 DMG - Holy) - Heals instead of damages
9. Basic Attack (15 DMG - Normal)
10. Power Smash (50 DMG - Normal)

---

## 📱 Telegram Mini App Integration

### TWA Features Implemented

1. **Automatic Detection**: App detects if running inside Telegram
2. **TWA SDK**: `@twa-dev/sdk` package installed
3. **Initialization**: Telegram WebApp auto-initializes on load
4. **Responsive**: UI adapts for Telegram's WebView

### Testing in Telegram

1. Create a Telegram Bot via @BotFather
2. Set up a Mini App with your deployment URL
3. Update `twaReturnUrl` in layout.tsx
4. Open bot and launch the Mini App

---

## 🔐 Environment Variables

All environment variables are in `/app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://doqnwztoitbdlfbenctb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_TON_MANIFEST_URL=http://localhost:3000/tonconnect-manifest.json
```

---

## 📊 Database Schema Overview

```
users
├─ id (UUID, PK)
├─ wallet_address (VARCHAR, UNIQUE)
└─ created_at (TIMESTAMP)

beasts (existing + new columns)
├─ id (SERIAL, PK)
├─ ... (existing columns)
├─ hp (INTEGER)
├─ max_hp (INTEGER)
├─ attack (INTEGER)
├─ defense (INTEGER)
├─ speed (INTEGER)
└─ level (INTEGER)

moves
├─ id (SERIAL, PK)
├─ name (VARCHAR)
├─ damage (INTEGER)
├─ type (VARCHAR)
└─ description (TEXT)

battles
├─ id (UUID, PK)
├─ player1_id (UUID, FK → users)
├─ player2_id (UUID, FK → users)
├─ beast1_id (INTEGER, FK → beasts)
├─ beast2_id (INTEGER, FK → beasts)
├─ winner_id (UUID, FK → users)
├─ status (VARCHAR)
├─ current_turn (UUID, FK → users)
└─ bet_amount (DECIMAL)

battle_moves (REALTIME ENABLED)
├─ id (UUID, PK)
├─ battle_id (UUID, FK → battles)
├─ player_id (UUID, FK → users)
├─ move_id (INTEGER, FK → moves)
├─ turn_number (INTEGER)
├─ damage_dealt (INTEGER)
└─ target_hp_remaining (INTEGER)

bets
├─ id (UUID, PK)
├─ battle_id (UUID, FK → battles)
├─ user_id (UUID, FK → users)
├─ amount (DECIMAL)
└─ won (BOOLEAN)
```

---

## 🐛 Troubleshooting

### Wallet Not Connecting
- Clear browser cache
- Check TON Connect extension/wallet
- Verify manifest URL is accessible

### Real-time Updates Not Working
- Verify Supabase Realtime is enabled for `battle_moves`
- Check browser console for WebSocket errors
- Ensure Supabase anon key has proper permissions

### Battle Not Starting
- Ensure schema.sql has been run completely
- Check that mock users and beasts exist
- Verify API routes are responding (check Network tab)

### CORS Errors
- Ensure Supabase API settings allow requests from your domain
- Check Supabase → Settings → API → CORS

---

## 🎨 UI/UX Features

- ✅ Retro 8-bit gaming theme
- ✅ Responsive design (mobile & desktop)
- ✅ Real-time HP bars
- ✅ Turn indicator badges
- ✅ Battle log with move history
- ✅ Loading states and animations
- ✅ Victory/defeat screens

---

## 📝 Next Steps

1. **Run schema.sql** in Supabase SQL Editor
2. **Enable Realtime** for battle_moves table
3. **Start dev server**: `yarn dev`
4. **Connect wallet** and test PVP battles
5. **Update manifest** for production deployment

---

## 🚀 Deployment Checklist

- [ ] Update `tonconnect-manifest.json` with production URLs
- [ ] Update `twaReturnUrl` with your Telegram bot
- [ ] Verify Supabase connection strings
- [ ] Test wallet connection on production
- [ ] Test real-time battles with multiple users
- [ ] Enable Supabase row-level security (RLS) policies if needed

---

## 💡 Tips

- **Testing**: Use two different browsers/incognito windows for PVP testing
- **Wallet**: You can use TON Wallet browser extension or Telegram Wallet
- **Mock Data**: The seeded beasts have different stats for balanced testing
- **Real-time**: Battle updates are instant - no page refresh needed!

---

## 🎯 Summary

You now have a complete ArenaRise game with:
- ✅ TON Connect wallet integration
- ✅ Supabase database with full schema
- ✅ Real-time PVP battles
- ✅ Turn-based combat system
- ✅ Mock data for testing
- ✅ Telegram Web App support
- ✅ Complete API layer

**Happy Gaming! 🎮**
