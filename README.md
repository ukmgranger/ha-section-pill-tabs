# Home Assistant Swipeable Pill Navigation

A highly polished, app-like pill navigation card for Home Assistant's Section layout. Seamlessly toggle dashboard sections per-device without requiring YAML, global helpers, or leaving empty grid gaps!

## ✨ Features
- **100% Device Specific (Local State):** Uses browser local storage. When you switch to "Upstairs" on your phone, your partner's phone stays on "Downstairs." No global `input_text` helpers required!
- **No "Black Hole" Gaps:** Includes a "Shadow Piercer" Anchor Card that cleanly removes hidden sections from Home Assistant's grid engine, ensuring your layout snaps perfectly shut.
- **Native GUI Editor:** Completely configure your tabs via the Home Assistant visual editor. No YAML required. Add as many tabs as you want natively!
- **App-Like Gestures:** Features smooth sliding background animations and robust swipe/drag pointer tracking.
- **Safe Edit Mode:** Automatically expands all sections when you click the Home Assistant pencil icon, so you can easily edit your dashboard without sections disappearing.

## 🚀 Installation

### Manual Installation
1. Download the `ywd-pill-selector-card.js` file.
2. Place the file into your Home Assistant `config/www/` directory.
3. Go to **Settings > Dashboards > 3-dot menu > Resources**.
4. Click **+ Add Resource**.
5. URL: `/local/ywd-pill-selector-card.js`
6. Resource Type: `JavaScript Module`.
7. Refresh your browser cache (Ctrl+F5).

## ⚙️ How to Use (100% GUI)

This integration uses two custom cards working together: the **Pill Selector** (the buttons) and the **Section Anchor** (the invisible listener).

### Step 1: Add the Pill Selector
1. Edit your dashboard and add a new Section where you want your navigation to live.
2. Click **Add Card** and search for **YWD Pill Selector**.
3. Use the visual editor to define your tabs (e.g., Tab 1 Label: `Downstairs`, Target: `Downstairs`). Make note of the **Target Room Name** you give each one.

### Step 2: Add the Anchors
1. Create your actual dashboard sections (e.g., a section for your Downstairs lights).
2. Inside the Downstairs section, click **Add Card** and search for **YWD Section Anchor**.
3. In the setup box, type the exact target name you used in the Pill Selector (e.g., `Downstairs`).
4. Repeat for your other sections (e.g., add an Anchor mapped to `Upstairs` in your Upstairs section).
5. Click **Done** on your dashboard to exit edit mode.

That's it! When you click or swipe the pill buttons, the Anchors receive the signal and dynamically collapse or expand their parent sections locally on your device.

## 🎨 Customization
The Pill Selector card allows you to easily customize:
- The active text color (Hex codes like `#5ec9c9`).
- The container background color (Hex codes like `#1a1a1a`).
- Unlimited dynamically added tabs via the GUI.

## Video Demo


https://github.com/user-attachments/assets/18cf309d-10a2-4866-9fb1-de207e491d18



https://github.com/user-attachments/assets/e0750d69-04a3-4fbc-a2bf-fe9317d80949



---
*Created to solve the multi-user dashboard clash and bring native, app-like navigation to Home Assistant.*
