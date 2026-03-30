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
    try {
      const [initialColor, initialPenColor, initialShapesColor, initialSticker, initialTool, initialEnabled] = await Promise.all([
        laserColorItem.getValue(),
        penColorItem.getValue(),
        shapesColorItem.getValue(),
        currentStickerItem.getValue(),
        currentToolItem.getValue(),
        annotationEnabledItem.getValue(),
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

      // Only enable current tool on init if enabled state is true
      if (initialEnabled && initialTool) {
        toolManager.setEnabled(initialTool, true);
      }

      const unwatchEnabled = annotationEnabledItem.watch(async (enabled) => {
        const activeTool = await currentToolItem.getValue();
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

      const unwatchTool = currentToolItem.watch(async (toolName) => {
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
        if (!message?.type) return;

        if (message.type === VISBOARD_MESSAGES.SET_ACTIVE) {
          const activeTool = currentToolItem.getValue().catch(() => 'laser');
          void activeTool.then((tool) => {
            toolManager.setEnabled(tool || 'laser', message.enabled);
          });
        } else if (message.type === VISBOARD_MESSAGES.TOGGLE_ACTIVE) {
          const activeTool = currentToolItem.getValue().catch(() => 'laser');
          void activeTool.then((tool) => {
            toolManager.toggle(tool || 'laser');
          });
        } else if (message.type === VISBOARD_MESSAGES.SET_TOOL) {
          void currentToolItem.setValue(message.tool);
        } else if (message.type === VISBOARD_MESSAGES.SETTINGS_UPDATED) {
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
    } catch (error) {
      throw error;
    }
  },
});