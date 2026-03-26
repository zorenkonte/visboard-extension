import '../styles/laser-overlay.css';
import { LaserController } from '../features/laser/controller';
import { PenController } from '../features/pen/controller';
import { ShapesController } from '../features/shapes/controller';
import { StickersController } from '../features/stickers/controller';
import { ToolManager } from '../features/tools/tool-manager';
import { VISBOARD_MESSAGES, type VisboardMessage } from '../shared/messages';
import {
  annotationEnabledItem,
  currentToolItem,
  laserColorItem,
  penColorItem,
  penWidthItem,
  shapesColorItem,
  shapesTypeItem,
  currentStickerItem,
} from '../shared/storage';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main: async () => {
    // Attach to window for inspection
    (window as any).visboardDebug = {
      ready: false,
      error: null as Error | null,
    };

    try {
      console.log('[Visboard] Content script initialized');

      const [initialColor, initialPenColor, initialShapesColor, initialSticker, initialTool, initialEnabled] = await Promise.all([
        laserColorItem.getValue(),
        penColorItem.getValue(),
        shapesColorItem.getValue(),
        currentStickerItem.getValue(),
        currentToolItem.getValue(),
        annotationEnabledItem.getValue(),
      ]);

      console.log('[Visboard] Initial state:', {
        initialColor,
        initialPenColor,
        initialShapesColor,
        initialSticker,
        initialTool,
        initialEnabled,
      });

      const toolManager = new ToolManager();
      const laserController = new LaserController(initialColor);
      const penController = new PenController(initialPenColor);
      const shapesController = new ShapesController(initialShapesColor);
      const stickersController = new StickersController(initialSticker);

      toolManager.register('laser', laserController);
      toolManager.register('pen', penController);
      toolManager.register('shapes', shapesController);
      toolManager.register('stickers', stickersController);

      (window as any).visboardDebug.toolManager = toolManager;
      (window as any).visboardDebug.laserController = laserController;
      (window as any).visboardDebug.penController = penController;
      (window as any).visboardDebug.shapesController = shapesController;
      (window as any).visboardDebug.stickersController = stickersController;

      // Only enable current tool on init if enabled state is true
      if (initialEnabled && initialTool) {
        console.log('[Visboard] Auto-enabling', initialTool, 'on init');
        toolManager.setEnabled(initialTool, true);
      }

      const unwatchEnabled = annotationEnabledItem.watch(async (enabled) => {
        const activeTool = await currentToolItem.getValue();
        console.log('[Visboard] Enabled changed:', { enabled, activeTool });
        if (!activeTool) return;
        toolManager.setEnabled(activeTool, enabled);
        // Disable other tools
        ['laser', 'pen', 'shapes', 'stickers'].forEach((tool) => {
          if (tool !== activeTool) {
            toolManager.setEnabled(tool, false);
          }
        });
      });

      const unwatchLaserColor = laserColorItem.watch((nextColor) => {
        console.log('[Visboard] Laser color changed:', nextColor);
        laserController.setLaserColor(nextColor);
      });

      const unwatchPenColor = penColorItem.watch((nextColor) => {
        console.log('[Visboard] Pen color changed:', nextColor);
        penController.setColor(nextColor);
      });

      const unwatchPenWidth = penWidthItem.watch((nextWidth) => {
        console.log('[Visboard] Pen width changed:', nextWidth);
        penController.setWidth(nextWidth);
      });

      const unwatchShapesColor = shapesColorItem.watch((nextColor) => {
        console.log('[Visboard] Shapes color changed:', nextColor);
        shapesController.setShapeColor(nextColor);
      });

      const unwatchShapesType = shapesTypeItem.watch((nextType) => {
        console.log('[Visboard] Shapes type changed:', nextType);
        shapesController.setShapeType(nextType);
      });

      const unwatchSticker = currentStickerItem.watch((nextSticker) => {
        console.log('[Visboard] Sticker changed:', nextSticker);
        stickersController.setCurrentSticker(nextSticker);
      });

      const unwatchTool = currentToolItem.watch(async (toolName) => {
        console.log('[Visboard] Tool changed:', toolName);
        if (!toolName) return;

        // Disable all tools first
        ['laser', 'pen', 'shapes', 'stickers'].forEach((tool) => {
          if (tool !== toolName) {
            toolManager.setEnabled(tool, false);
          }
        });

        // Enable the new tool if annotation is enabled
        const enabled = await annotationEnabledItem.getValue();
        toolManager.setEnabled(toolName, enabled);
      });

      browser.runtime.onMessage.addListener((message: VisboardMessage) => {
        console.log('[Visboard] Message received:', message);
        (window as any).visboardDebug.lastMessage = message;

        if (!message?.type) return;

        if (message.type === VISBOARD_MESSAGES.SET_ACTIVE) {
          console.log('[Visboard] Setting active:', message.enabled);
          const activeTool = currentToolItem.getValue().catch(() => 'laser');
          void activeTool.then((tool) => {
            toolManager.setEnabled(tool || 'laser', message.enabled);
          });
        } else if (message.type === VISBOARD_MESSAGES.TOGGLE_ACTIVE) {
          console.log('[Visboard] Toggling active');
          const activeTool = currentToolItem.getValue().catch(() => 'laser');
          void activeTool.then((tool) => {
            toolManager.toggle(tool || 'laser');
          });
        } else if (message.type === VISBOARD_MESSAGES.SET_TOOL) {
          console.log('[Visboard] Setting tool:', message.tool);
          void currentToolItem.setValue(message.tool);
        } else if (message.type === VISBOARD_MESSAGES.SETTINGS_UPDATED) {
          console.log('[Visboard] Settings updated');
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
        unwatchLaserColor();
        unwatchPenColor();
        unwatchPenWidth();
        unwatchShapesColor();
        unwatchShapesType();
        unwatchSticker();
        unwatchTool();
        toolManager.setEnabled('laser', false);
        toolManager.setEnabled('pen', false);
        toolManager.setEnabled('shapes', false);
        toolManager.setEnabled('stickers', false);
      });

      (window as any).visboardDebug.ready = true;
      console.log('[Visboard] Content script fully initialized');
    } catch (error) {
      console.error('[Visboard] Content script error:', error);
      (window as any).visboardDebug.error = error;
      throw error;
    }
  },
});