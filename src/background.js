const TOGGLE_LASER_COMMAND = "toggle-laser";
const TOGGLE_LASER_ACTION = "toggleLaser";

function sendActionToActiveTab(action, tabId) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action });
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (!activeTab?.id) return;
    chrome.tabs.sendMessage(activeTab.id, { action });
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command !== TOGGLE_LASER_COMMAND) return;

  sendActionToActiveTab(TOGGLE_LASER_ACTION);
});
