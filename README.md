# Laser Pointer Chrome Extension

A Chrome extension that adds a laser pointer effect to any webpage, similar to Google Meet's disappearing ink feature.

## Features

- 🎯 Toggle laser pointer mode with keyboard shortcut
- ✨ Smooth fading trail effect (like Excalidraw)
- ⌨️ Press `Esc` to instantly exit laser mode
- 🚫 Blocks page clicks while laser mode is active
- 🖱️ Hold and drag to draw
- 🌐 Works on any webpage

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `laser-pointer-extension` folder

## Usage

1. **Toggle Laser Pointer Mode**: 
   - Windows/Linux: `Ctrl + Shift + L`
   - Mac: `Command + Shift + L`

2. **Draw**: Hold down the mouse button and drag to draw with the laser pointer
3. The trail will automatically fade out like disappearing ink
4. Press `Esc` (or the hotkey again) to turn off laser pointer mode
5. While laser mode is active, page elements are intentionally not clickable

## Customization

You can customize the hotkey by:
1. Going to `chrome://extensions/shortcuts`
2. Finding "Laser Pointer"
3. Setting your preferred keyboard shortcut

## How It Works

- Creates an overlay canvas on the page
- Draws a fading trail that follows your cursor
- Trail points automatically fade out using Excalidraw's decay timing
- Uses requestAnimationFrame for smooth animation
