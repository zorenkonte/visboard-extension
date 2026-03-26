import { LaserController } from "./features/laser/controller";
import { ToolManager } from "./features/tools/tool-manager";

const toolManager = new ToolManager();
toolManager.register("laser", new LaserController());

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggleLaser") {
    toolManager.toggle("laser");
  }
});
