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
      background.ts            # service worker: command + message router
      content.ts               # injected on <all_urls>: wires tools to storage/messages
      popup/
         index.html
         main.ts
         App.vue               # popup shell + tool-panel orchestration
   components/                 # reusable popup UI
      layout/PopupHeader.vue
      popup/AnnotationToggle.vue
      popup/ToolSelector.vue
      popup/StatusFooter.vue
      ui/ColorSwatch.vue
      ui/StepControl.vue
      ui/ToggleSwitch.vue
   modules/                    # per-tool settings panels (popup side)
      laser/LaserSettings.vue
      pen/PenSettings.vue
      shapes/ShapesSettings.vue
      stickers/StickersSettings.vue
   features/                   # page-side tool logic
      laser/
         config.ts
         controller.ts
         math.ts
         path.ts
         pointer.ts
         trail.ts
      pen/controller.ts
      shapes/controller.ts
      stickers/controller.ts
      tools/tool-manager.ts
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

> Note: `features/` holds the page-side drawing logic; `modules/` holds the
> matching Vue settings panels rendered in the popup.

## 4) Core Features

- **Laser pointer** with a smooth, self-decaying fading trail (custom
  stroke-outline geometry + `requestAnimationFrame` render loop)
- **Pen** — persistent freehand drawing with configurable color and width
- **Shapes** — click-and-drag rectangles, circles, and lines
- **Stickers** — click to stamp emoji that fade in and auto-expire
- Full-screen SVG overlay blocks page interactions while a tool is active
- `Esc` to deactivate the current tool
- **Master enable gate** (`Ctrl/Cmd + Shift + L`) — arms the extension without
  auto-activating any tool
- **Per-tool toggle shortcuts**, customizable from inside the popup (defaults
  `Ctrl/Cmd + Shift + 1..4`); tool shortcuts only work once the extension is enabled
- `ToolManager` architecture — only one tool active at a time, easy to extend

## 5) Popup UI

- Futuristic glassmorphism panel with neon glow effects
- Visboard branding and logo treatment
- Annotation mode toggle
- Tool selector (laser / pen / shapes / stickers)
- Per-tool settings panel that swaps with an animated transition:
   - Laser: color picker
   - Pen: color picker + width step control
   - Shapes: color picker + shape type (rect / circle / line)
   - Stickers: emoji picker from the sticker pack
- Shortcut display + live sync status

## 6) State, Persistence, and Messaging

### Pinia store

- `src/stores/annotation.ts` manages:
   - enabled/disabled annotation state
   - selected tool
   - per-tool settings: laser color, pen color, pen width, shapes color,
     shapes type, current sticker

### Persistence (WXT storage helpers)

- `src/shared/storage.ts` defines strongly typed storage items:
   - `local:annotationEnabled`
   - `local:currentTool`
   - `local:laserColor`
   - `local:penColor`
   - `local:penWidth`
   - `local:shapesColor`
   - `local:shapesType`
   - `local:currentSticker`
- The content script uses `storage.watch(...)` on these keys, so popup
  changes propagate live to the active page.

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

- Enable the extension (master gate — does not activate a tool by itself):
   - Windows/Linux: `Ctrl + Shift + L`
   - macOS: `Command + Shift + L`
- Activate a tool once enabled, either by:
   - clicking it in the popup, or
   - pressing its keyboard shortcut (default `Ctrl/Cmd + Shift + 1..4`)
- Customize a tool's shortcut in the popup: open its settings panel and click the
  shortcut field, then press your preferred combo (must include Ctrl/Cmd or Alt;
  conflicts with another tool or the master toggle are rejected)
- Adjust each tool's settings in its panel
- Draw by click + drag (laser, pen, shapes) or click to stamp (stickers)
- Press `Esc` to deactivate the current tool

## License

MIT

