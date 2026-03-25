# Visboard Chrome Extension

Visboard is a lightweight screen annotation extension for Chrome. It adds a laser pointer / drawing overlay to any webpage, with smooth fade and shortcut-based controls.

## Features

- 🎯 Toggle annotation mode with keyboard shortcut
- ✨ Smooth fading trail effect
- 🖊️ Draw with mouse drag and hold
- 🌈 Color support for marker and pointer (future expansion)
- 🛠️ Hide UI and show only drawing overlay (future feature)
- 🌐 Works on all websites

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `laser-pointer-extension` folder (or your cloned repository folder)

## Usage

1. **Toggle Visboard Overlay**: 
   - Windows/Linux: `Ctrl + Shift + L`
   - macOS: `Command + Shift + L`

2. **Draw**: Hold down the mouse button and drag on the page
3. **Exit**: Press `Esc` or the toggle hotkey again
4. While overlay is active, page interactions are throttled intentionally to keep drawing stable

## Shortcut Customization

1. Open `chrome://extensions/shortcuts`
2. Find "Toggle laser pointer" or "Visboard toggle"
3. Set your preferred key combo

## Project Structure

- `manifest.json` — extension metadata and permissions
- `background.js` — service worker controls extension behavior
- `content.js` — injects overlay and handles pointer events
- `laser.css` — overlay styles
- `icon16.png`, `icon48.png`, `icon128.png` — extension icons

## License

MIT

