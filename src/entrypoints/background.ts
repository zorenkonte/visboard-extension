import { annotationEnabledItem } from '../shared/storage';
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

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-laser') return;

    const enabled = await annotationEnabledItem.getValue();
    const nextEnabled = !enabled;
    await annotationEnabledItem.setValue(nextEnabled);
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
  });
});