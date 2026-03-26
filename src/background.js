const TOGGLE_LASER_COMMAND = "toggle-laser";
const TOGGLE_LASER_ACTION = "toggleLaser";

chrome.commands.onCommand.addListener((command) => {
  if (command !== TOGGLE_LASER_COMMAND) return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (!activeTab?.id) return;
    chrome.tabs.sendMessage(activeTab.id, { action: TOGGLE_LASER_ACTION });
  });
});
