import '../styles/laser-overlay.css';
import { LaserController } from '../features/laser/controller';
import { PenController } from '../features/pen/controller';
import { ShapesController } from '../features/shapes/controller';
import { StickersController } from '../features/stickers/controller';
import { ToolManager } from '../features/tools/tool-manager';
import { VISBOARD_MESSAGES, type ToolName, type VisboardMessage } from '../shared/messages';
import { eventToShortcut } from '../shared/shortcuts';
import {
  annotationEnabledItem,
  activeToolItem,
  toolShortcutsItem,
  laserColorItem,
  penColorItem,
  penWidthItem,
  shapesColorItem,
  shapesTypeItem,
  currentStickerItem,
} from '../shared/content-storage';

const TOOL_NAMES: ToolName[] = ['laser', 'pen', 'shapes', 'stickers'];

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main: async () => {
    const [
      initialColor,
      initialPenColor,
      initialShapesColor,
      initialSticker,
      initialActiveTool,
      initialEnabled,
      initialShortcuts,
    ] = await Promise.all([
      laserColorItem.getValue(),
      penColorItem.getValue(),
      shapesColorItem.getValue(),
      currentStickerItem.getValue(),
      activeToolItem.getValue(),
      annotationEnabledItem.getValue(),
      toolShortcutsItem.getValue(),
    ]);

    const toolManager = new ToolManager();
    const laserController = new LaserController(initialColor);
    const penController = new PenController(initialPenColor);
    const shapesController = new ShapesController(initialShapesColor);
    const stickersController = new StickersController(initialSticker);

    toolManager.register('laser', laserController);
    toolManager.register('pen', penController);
    toolManager.register('shapes', shapesController);
    toolManager.register('stickers', stickersController);

    // Local mirror of cross-context state, kept in sync via storage watches.
    let enabledState = initialEnabled;
    let activeToolState = initialActiveTool;
    let shortcutMap = initialShortcuts;

    // Enable exactly one tool (or none). Always disables the others first so
    // only a single overlay is ever live.
    function applyActiveTool(tool: ToolName | null): void {
      for (const name of TOOL_NAMES) {
        toolManager.setEnabled(name, enabledState && tool === name);
      }
    }

    // Activate from the persisted active tool only when the extension is on.
    if (enabledState && initialActiveTool) {
      applyActiveTool(initialActiveTool);
    }

    const unwatchEnabled = annotationEnabledItem.watch((nextEnabled) => {
      enabledState = nextEnabled;
      // Disabling clears every overlay; enabling re-applies the active tool
      // (normally null, since disable clears it).
      applyActiveTool(nextEnabled ? activeToolState : null);
    });

    const unwatchActiveTool = activeToolItem.watch((nextActive) => {
      activeToolState = nextActive;
      applyActiveTool(nextActive);
    });

    const unwatchShortcuts = toolShortcutsItem.watch((nextShortcuts) => {
      shortcutMap = nextShortcuts;
    });

    const unwatchLaserColor = laserColorItem.watch((nextColor) => {
      laserController.setLaserColor(nextColor);
    });

    const unwatchPenColor = penColorItem.watch((nextColor) => {
      penController.setColor(nextColor);
    });

    const unwatchPenWidth = penWidthItem.watch((nextWidth) => {
      penController.setWidth(nextWidth);
    });

    const unwatchShapesColor = shapesColorItem.watch((nextColor) => {
      shapesController.setShapeColor(nextColor);
    });

    const unwatchShapesType = shapesTypeItem.watch((nextType) => {
      shapesController.setShapeType(nextType);
    });

    const unwatchSticker = currentStickerItem.watch((nextSticker) => {
      stickersController.setCurrentSticker(nextSticker);
    });

    // Single top-level shortcut handler. Tool shortcuts and Escape only act
    // while the extension is enabled; everything else passes through to the
    // page untouched.
    function handleGlobalKeydown(event: KeyboardEvent): void {
      if (!enabledState) return;

      if (event.key === 'Escape') {
        if (activeToolState !== null) {
          event.preventDefault();
          event.stopPropagation();
          void activeToolItem.setValue(null);
        }
        return;
      }

      const shortcut = eventToShortcut(event);
      if (!shortcut) return;

      for (const tool of TOOL_NAMES) {
        if (shortcutMap[tool] === shortcut) {
          event.preventDefault();
          event.stopPropagation();
          void activeToolItem.setValue(activeToolState === tool ? null : tool);
          return;
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeydown, true);

    browser.runtime.onMessage.addListener((message: VisboardMessage) => {
      if (!message?.type) return;

      // Enable/disable and tool activation now flow through storage watches;
      // only live setting updates still arrive as messages.
      if (message.type === VISBOARD_MESSAGES.SETTINGS_UPDATED) {
        void Promise.all([
          laserColorItem.getValue().then((color) => laserController.setLaserColor(color)),
          penColorItem.getValue().then((color) => penController.setColor(color)),
          shapesColorItem.getValue().then((color) => shapesController.setShapeColor(color)),
          currentStickerItem.getValue().then((sticker) => stickersController.setCurrentSticker(sticker)),
        ]);
      }
    });

    addEventListener('unload', () => {
      unwatchEnabled();
      unwatchActiveTool();
      unwatchShortcuts();
      unwatchLaserColor();
      unwatchPenColor();
      unwatchPenWidth();
      unwatchShapesColor();
      unwatchShapesType();
      unwatchSticker();
      window.removeEventListener('keydown', handleGlobalKeydown, true);
      applyActiveTool(null);
    });
  },
});
