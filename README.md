# Visboard Chrome Extension

Visboard is a lightweight screen-annotation extension for Chrome. It currently ships a laser pointer tool and is structured for additional tools like pen, stickers, and shapes.

## Features

- Toggle annotation mode with a keyboard shortcut
- Smooth fading laser trail
- Draw by click-and-drag
- Blocks page interactions while drawing for consistent input

## Development

```bash
npm install
npm run build
```

- `npm run build` creates a minified extension package in `dist/`
- Output keeps Chrome manifest paths (`src/background.js`, `src/content.js`, `src/laser.css`)

### Fast iteration loop

```bash
npm run dev
```

- `npm run dev` runs Vite in watch mode and rebuilds `dist/` on file changes
- After each rebuild, open `chrome://extensions/` and click **Reload** on Visboard
- Refresh the target webpage to load the latest content script changes

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

## Usage

- Toggle Visboard overlay
   - Windows/Linux: `Ctrl + Shift + L`
   - macOS: `Command + Shift + L`
- Open app UI: click the Visboard extension icon
- Draw: hold mouse button and drag
- Change laser color: use the color picker in the extension popup UI
- Exit: press `Esc` or toggle again

## Architecture

- `src/content.js`: entrypoint + message routing
- `src/features/tools/tool-manager.js`: tool registration/toggling abstraction
- `src/features/laser/*`: laser-specific modules (`controller`, `trail`, `pointer`, `math`, `path`, `config`)

## License

MIT

