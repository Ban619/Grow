Refactor & Setup Status

## Completed Refactoring
- Created `src/styles/`, `src/hooks/`, and `src/assets/` directories.
- Moved `legacy-style.css` into `src/styles/legacy.css` and imported it via `src/main.jsx`.
- Added linting/format/test scripts to `package.json` and baseline configs: `.eslintrc.cjs`, `.prettierrc`, `vitest.config.js`.
- ✅ Dependencies installed (`npm install` completed)
- ✅ Fixed import case sensitivity issue in GameCanvas.jsx (EditMode component)

## Completed Backend Setup
- ✅ PHP/Symfony backend configured (server-php/)
- ✅ Mercure real-time chat implemented
- ✅ Database migrations created (use MySQL locally or PostgreSQL in Docker)
- ✅ API endpoints ready for game state and chat

## Running the System

### Local Development (MySQL locally)
```bash
# Terminal 1: Start PHP server
cd server-php
php -S 127.0.0.1:8080 -t public/

# Terminal 2: Start Vite dev server
cd client
npm run dev
```

### Docker Development (PostgreSQL in Docker)
```bash
# Start containers
cd server-php
docker compose up -d

# Set up database
docker compose exec database psql -U app -d app -c "CREATE TABLE IF NOT EXISTS player..."

# Start Vite dev server
cd ../client
npm run dev
```

## System Status
- ✅ Import paths corrected (case-sensitive filesystem compatible)
- ✅ Mercure CORS configured for dev server (localhost:5173, 127.0.0.1:8000)
- ✅ Database configuration clarified (.env for local MySQL, .env.local.docker for Docker)
- ✅ Chat system fully integrated with Mercure real-time updates
- ✅ Automatic retry logic with exponential backoff

## Chat System - Troubleshooting

### "Chat connection failed" Error

**Quick Checklist:**
1. ✅ Is PHP backend running? Test: `curl http://127.0.0.1:8080/api/chat/health`
2. ✅ Is Mercure running? Test: `curl http://localhost/.well-known/mercure` (should keep connection open)
3. ✅ Docker port mapping: Check `docker compose ps` — Mercure should be **Up**
4. ✅ Browser console: Check for CORS errors or network failures
5. ✅ Vite proxy working? Test: `curl http://127.0.0.1:5173/.well-known/mercure` from your machine

### Detailed Debugging

**Option A: Using Docker (recommended)**
```bash
# In server-php directory:
docker compose up -d
docker compose ps  # Verify all services are "Up"
docker compose logs mercure  # Check for errors
curl http://localhost/.well-known/mercure?topic=chat/global  # Test connection (should hang, not error)
```

**Option B: Manual PHP server**
```bash
# Terminal 1: Start PHP backend
cd server-php
php -S 127.0.0.1:8080 -t public/

# Terminal 2: Start Vite frontend
cd client
npm run dev

# Terminal 3: Test API
curl http://127.0.0.1:8080/api/chat/health
curl http://127.0.0.1:8080/api/load?player=player1
```

### Browser Console Debugging
Open browser DevTools (F12) → Console tab:
- Look for red errors with 🔴 prefix
- Should show: `✅ Mercure connected` when successful
- Watch for network failures to `http://127.0.0.1:5173/.well-known/mercure`

### Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| `Connection refused` | Mercure not running | `docker compose up -d mercure` or ensure port 80 is not blocked |
| `HTTP 503` | Mercure service unhealthy | `docker compose logs mercure` - check for startup errors |
| `EventStream ended` | Connection dropped | Auto-retry activates (exponential backoff) |
| CORS error in console | Frontend/backend mismatch | Verify `.env` CORS_ALLOW_ORIGIN includes your dev port |
| "Please refresh to retry" | Max retries exceeded | Refresh page once services are running |

### Verify Chat Functionality

Once connected:
1. Open chat panel (right side of screen)
2. Type a message and press Enter
3. Message should appear in chat immediately
4. Open a second browser/tab and verify message appears there too (real-time sync)

### Environment Variables to Check

**server-php/.env:**
```
MERCURE_URL=http://localhost:80/.well-known/mercure
MERCURE_PUBLIC_URL=http://localhost/.well-known/mercure
MERCURE_JWT_SECRET=!ChangeThisMercureHubJWTSecretKey!
```

**client/vite.config.js:**
```javascript
proxy: {
  '/api': 'http://127.0.0.1:8080',
  '/.well-known/mercure': {
    target: 'http://127.0.0.1:80',
    changeOrigin: true,
    ws: false,
    headers: { 'Accept': 'text/event-stream' }
  }
}
```
