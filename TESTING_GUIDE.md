# Testing Guide - New Features

## 1. Direct Messaging

### Setup
1. Start the game and login as **player1**
2. Open another browser window/tab (or incognito) and login as **player2**

### Test Steps
1. In player1's window, click the **💬 Messages** button (new button in right sidebar)
2. You should see an empty conversations list
3. In player2's window, send a message to player1:
   - Click **💬 Messages**
   - You may see player1 in conversations (if there's prior chat)
   - Look for an input area and type a message
   - Click **Send**
4. In player1's window, the message should appear in real-time (via Mercure)
5. Click on player2 in the conversations list to open the conversation
6. Type a reply and send it
7. Verify the message thread shows both directions with timestamps
8. Check the unread badge count updates correctly

### Expected Behavior
- Messages are displayed with sender/receiver distinction (different colors)
- Time stamps show relative time (now, 5m, 2h, etc.)
- Conversations list shows the most recent conversation first
- Unread count badges appear and disappear correctly
- Smooth animations when opening/closing the panel

---

## 2. Seasonal Crops

### How to Test
1. Login to the game
2. Open the **Seed Picker** by clicking on soil/grass to plant
3. At the top of the seed picker, look for a **"[Season] Season ★"** indicator
4. Notice the available crops include:
   - Regular crops (wheat, corn, berry, pumpkin)
   - Seasonal crops (marked with **★** badge)

### Expected Seasonal Crops (by date)
- **Winter** (Dec, Jan, Feb): snowwheat ❄️, icepumpkin 🧊
- **Spring** (Mar, Apr, May): tulip 🌷, springcorn 🌽
- **Summer** (Jun, Jul, Aug): sunflower 🌻, honeydew 🍈
- **Autumn** (Sep, Oct, Nov): pumpkinpatch 🎃, harvestwheat 🌾

### API Testing
```bash
# Get current seasonal crops
curl http://127.0.0.1:8080/api/crops/seasonal

# Response will show:
{
  "ok": true,
  "season": 0-3,
  "seasonName": "Winter/Spring/Summer/Autumn",
  "crops": {...}
}
```

### Expected Behavior
- Seasonal crops show with different colors and emojis
- Growth times vary (some faster, some slower than base crops)
- Harvest values are different from base crops
- Season indicator updates based on current month
- All seasonal crops have descriptions (visible in UI)

---

## 3. Tutorial System

### First Time Setup
1. **Create a new player account** (or reset tutorial for existing player via API)
2. Login to start the game
3. The **Tutorial Modal** should appear with:
   - 🌱 Welcome icon
   - "Welcome to Grow!" title
   - Description text
   - Tips section with bullet points
   - "Got it!" button to proceed
   - "Skip Tutorial" button to skip entirely

### Tutorial Progression
The tutorial shows steps in order:
1. **welcomeShown** - Welcome modal appears
2. **firstPlant** - After clicking "Got it!", next modal shows instructions to plant
3. **firstHarvest** - After planting, modal appears about harvesting
4. **firstBuilding** - After harvesting, modal about placing buildings
5. **tutorialComplete** - Final completion modal

### Test Steps
1. Follow the tutorial prompts (click "Got it!" on each)
2. Complete the action mentioned (plant, harvest, build)
3. Next tutorial step should appear automatically
4. Watch the **progress bar** at bottom fill as you complete steps
5. When all steps complete, tutorial disappears
6. Refresh page - tutorial should NOT reappear (progress is saved)

### Skip Test
1. In any tutorial modal, click **"Skip Tutorial"**
2. All remaining steps complete immediately
3. Tutorial disappears
4. Progress is saved in database

### API Testing
```bash
# Check tutorial progress for a player
curl http://127.0.0.1:8080/api/tutorial/status?player=player1

# Mark a step manually (for testing)
curl -X POST http://127.0.0.1:8080/api/tutorial/mark-step \
  -H "Content-Type: application/json" \
  -d '{
    "player": "player1",
    "step": "firstPlant"
  }'
```

### Expected Behavior
- Tutorial modals are centered and semi-transparent overlay
- Icons bounce animation
- Progress bar fills smoothly
- Toast notifications appear on completion ("🎉 Planted your first seed!")
- Tutorial state persists across sessions
- Each step has relevant tips and descriptions

---

## Integration Testing

### Test All Three Features Together
1. **New Game Flow**:
   - Start as new player
   - See tutorial welcome
   - Complete first plant step
   - Notice seasonal crops in picker
   - Harvest crop
   - Open messages (should be empty)
   - Complete tutorial

2. **Multiplayer Flow**:
   - Player1 and Player2 both login
   - Player2 sends Player1 a message: "Hey, what seasonal crops do you see?"
   - Player1 sees notification and opens messages
   - Player1 replies with current season crops
   - Both see messages in real-time

3. **State Persistence**:
   - Complete tutorial steps
   - Save game
   - Refresh page
   - Verify tutorial is gone (marked complete)
   - Check that seasonal crops still show correctly
   - Open messages and verify conversation history

---

## Common Issues & Fixes

### Direct Messages Not Working
- Check Mercure is running: `curl http://localhost/.well-known/mercure`
- Verify backend is running: `curl http://127.0.0.1:8080/api/health`
- Check browser console for CORS errors
- Try opening messages panel again

### Seasonal Crops Not Showing
- Verify API endpoint: `curl http://127.0.0.1:8080/api/crops/seasonal`
- Check current date/month setting on system (affects which season)
- Clear browser cache (Ctrl+Shift+Delete)
- Check console for fetch errors

### Tutorial Not Appearing
- Create a brand new player account
- Or reset via API: POST `/api/tutorial/mark-step` with non-existent step
- Check localStorage for `grow:state` to see tutorial progress
- Verify player tutorialProgress field is empty in database

---

## Browser DevTools Debugging

### Network Tab
- Watch for requests to `/api/dm/send`, `/api/dm/conversations`, `/api/crops/seasonal`, `/api/tutorial/*`
- All should return 200 OK responses
- Check response payloads

### Console
- Look for errors related to Mercure connections
- Tutorial should log component mounting/stepping
- Seed picker should log seasonal crops fetch

### Application Tab > Local Storage
- `grow:state` - contains player game state including tutorialProgress
- Check tutorialProgress object updates as you complete steps

---

## Performance Notes
- DirectMessages component is lightweight (< 5KB)
- Seasonal crops fetched once on SeedPicker mount
- Tutorial checks progress on App mount
- No impact on GameCanvas performance
- Mercure pub/sub is efficient for real-time updates

---

## Success Criteria
✅ All three features work independently
✅ All three features work together without conflicts
✅ Database migrations executed successfully
✅ Real-time messaging works via Mercure
✅ Seasonal crops persist across sessions
✅ Tutorial progress saves to database
✅ No console errors
✅ Responsive design works on mobile
✅ Accessibility considerations met (color contrast, semantic HTML)
