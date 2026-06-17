import {
  annotationEnabledItem,
  activeToolItem,
  laserColorItem,
  penColorItem,
  penWidthItem,
  shapesColorItem,
  shapesTypeItem,
  currentStickerItem,
  toolShortcutsItem,
} from '../shared/storage';
import { VISBOARD_MESSAGES, type VisboardMessage } from '../shared/messages';

async function sendToActiveTab(message: VisboardMessage): Promise<void> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (!activeTab?.id) return;

  try {
    await browser.tabs.sendMessage(activeTab.id, message);
  } catch {
    // Ignore tabs without content script injection.
  }
}

async function broadcastToAllTabs(message: VisboardMessage): Promise<void> {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await browser.tabs.sendMessage(tab.id, message);
    } catch {
      // Ignore tabs without content script injection.
    }
  }
}

export default defineBackground(() => {
  // Set up watchers to broadcast storage changes to all content scripts
  annotationEnabledItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'annotationEnabled',
      value,
    } as VisboardMessage);
  });

  activeToolItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'activeTool',
      value,
    } as VisboardMessage);
  });

  laserColorItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'laserColor',
      value,
    } as VisboardMessage);
  });

  penColorItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'penColor',
      value,
    } as VisboardMessage);
  });

  penWidthItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'penWidth',
      value,
    } as VisboardMessage);
  });

  shapesColorItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'shapesColor',
      value,
    } as VisboardMessage);
  });

  shapesTypeItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'shapesType',
      value,
    } as VisboardMessage);
  });

  currentStickerItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'currentSticker',
      value,
    } as VisboardMessage);
  });

  toolShortcutsItem.watch((value) => {
    void broadcastToAllTabs({
      type: VISBOARD_MESSAGES.STORAGE_CHANGED,
      key: 'toolShortcuts',
      value,
    } as VisboardMessage);
  });

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-laser') return;

    // Master gate only: toggles the extension without activating any tool.
    const enabled = await annotationEnabledItem.getValue();
    const nextEnabled = !enabled;
    await annotationEnabledItem.setValue(nextEnabled);
    if (!nextEnabled) {
      await activeToolItem.setValue(null);
    }
    await sendToActiveTab({ type: VISBOARD_MESSAGES.SET_ACTIVE, enabled: nextEnabled });
  });

  browser.runtime.onMessage.addListener((message: VisboardMessage) => {
    if (!message?.type) return;

    if (message.type === VISBOARD_MESSAGES.TOGGLE_ACTIVE) {
      void annotationEnabledItem.getValue().then(async (enabled) => {
        const nextEnabled = !enabled;
        await annotationEnabledItem.setValue(nextEnabled);
        await sendToActiveTab({ type: VISBOARD_MESSAGES.SET_ACTIVE, enabled: nextEnabled });
      });
      return;
    }

    if (message.type === VISBOARD_MESSAGES.SET_ACTIVE) {
      void annotationEnabledItem.setValue(message.enabled).then(() => sendToActiveTab(message));
      return;
    }

    if (
      message.type === VISBOARD_MESSAGES.SET_TOOL ||
      message.type === VISBOARD_MESSAGES.SETTINGS_UPDATED
    ) {
      void sendToActiveTab(message);
    }

    // Handle storage get requests from content scripts
    if (message.type === VISBOARD_MESSAGES.GET_STORAGE) {
      const key = (message as any).key;
      void (async () => {
        let value: any;
        switch (key) {
          case 'annotationEnabled':
            value = await annotationEnabledItem.getValue();
            break;
          case 'activeTool':
            value = await activeToolItem.getValue();
            break;
          case 'laserColor':
            value = await laserColorItem.getValue();
            break;
          case 'penColor':
            value = await penColorItem.getValue();
            break;
          case 'penWidth':
            value = await penWidthItem.getValue();
            break;
          case 'shapesColor':
            value = await shapesColorItem.getValue();
            break;
          case 'shapesType':
            value = await shapesTypeItem.getValue();
            break;
          case 'currentSticker':
            value = await currentStickerItem.getValue();
            break;
          case 'toolShortcuts':
            value = await toolShortcutsItem.getValue();
            break;
        }
        await sendToActiveTab({
          type: VISBOARD_MESSAGES.STORAGE_VALUE,
          key,
          value,
        } as VisboardMessage);
      })();
      return;
    }

    // Handle storage set requests from content scripts
    if (message.type === VISBOARD_MESSAGES.SET_STORAGE) {
      const key = (message as any).key;
      const value = (message as any).value;
      void (async () => {
        switch (key) {
          case 'annotationEnabled':
            await annotationEnabledItem.setValue(value);
            break;
          case 'activeTool':
            await activeToolItem.setValue(value);
            break;
          case 'laserColor':
            await laserColorItem.setValue(value);
            break;
          case 'penColor':
            await penColorItem.setValue(value);
            break;
          case 'penWidth':
            await penWidthItem.setValue(value);
            break;
          case 'shapesColor':
            await shapesColorItem.setValue(value);
            break;
          case 'shapesType':
            await shapesTypeItem.setValue(value);
            break;
          case 'currentSticker':
            await currentStickerItem.setValue(value);
            break;
          case 'toolShortcuts':
            await toolShortcutsItem.setValue(value);
            break;
        }
      })();
      return;
    }
  });
});