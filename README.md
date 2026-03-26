# Visboard — WXT + Vue 3 + TypeScript

Visboard is a production-ready browser annotation extension built with WXT (MV3), Vue 3.5+, strict TypeScript, Pinia state management, Tailwind CSS 4, and a modern neon-themed popup UI.

## 1) Setup Commands (WXT-first)

```bash
# 1) Scaffold a WXT project
npx wxt@latest init visboard-extension

# 2) Choose:
#    - Framework: Vue
#    - Language: TypeScript
#    - Manifest: MV3

# 3) Enter the project
cd visboard-extension

# 4) Install dependencies
npm install

# 5) Start development for Chrome
npm run dev:chrome
```

## 2) Recommended WXT Config

`wxt.config.ts`

- Uses `@wxt-dev/module-vue`
- Enables Tailwind v4 via `@tailwindcss/vite`
- Sets MV3 permissions (`storage`, `activeTab`)
- Registers command `Ctrl/Cmd + Shift + L`

## 3) Project Structure

```txt
src/
   entrypoints/
      background.ts
      content.ts
      popup/
         index.html
         main.ts
         App.vue
   features/
      laser/
         config.ts
         controller.ts
         math.ts
         path.ts
         pointer.ts
         trail.ts
      tools/
         tool-manager.ts
   shared/
      messages.ts
      storage.ts
   stores/
      annotation.ts
   styles/
      laser-overlay.css
      tailwind.css
   env.d.ts
```

## 4) Core Features Preserved

- Laser pointer with smooth fading trail
- Click-and-drag drawing
- Overlay blocks page interactions while active
- `Esc` to exit annotation mode
- Keyboard command toggle (`Ctrl/Cmd + Shift + L`)
- Tool-manager architecture for future tools (Pen, Shapes, Stickers)

## 5) Popup UI Improvements

- Futuristic glassmorphism panel with neon glow effects
- Visboard branding and logo treatment
- Annotation mode toggle
- Tool section with future-ready tabs/buttons
- Live laser color picker with instant preview
- Shortcut display + live sync status

## 6) State, Persistence, and Messaging

### Pinia store

- `src/stores/annotation.ts` manages:
   - enabled/disabled annotation state
   - selected tool
   - laser color

### Persistence (WXT storage helpers)

- `src/shared/storage.ts` defines strongly typed storage items:
   - `local:annotationEnabled`
   - `local:currentTool`
   - `local:laserColor`

### Popup ↔ Content communication

- `src/shared/messages.ts` defines typed message contracts.
- Popup sends state changes through `browser.runtime.sendMessage(...)`.
- Background routes messages to active tab content script.
- Content script applies updates to tool manager and laser controller.

## 7) Development Workflow (WXT)

```bash
# Start extension dev mode (hot rebuild + extension output)
npm run dev:chrome

# Production build
npm run build

# Optional distributable zip
npm run zip
```

## 8) Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `.output/chrome-mv3/`

## 9) Usage

- Toggle annotation mode:
   - Windows/Linux: `Ctrl + Shift + L`
   - macOS: `Command + Shift + L`
- Open popup from extension toolbar icon
- Draw laser trail by click + drag
- Press `Esc` to stop active annotation

## License

MIT

