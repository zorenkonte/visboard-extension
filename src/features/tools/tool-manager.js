export class ToolManager {
  constructor() {
    this.tools = new Map();
  }

  register(name, tool) {
    this.tools.set(name, tool);
  }

  get(name) {
    return this.tools.get(name) ?? null;
  }

  toggle(name) {
    const tool = this.get(name);
    if (!tool || typeof tool.toggle !== "function") return;
    tool.toggle();
  }

  setEnabled(name, enabled) {
    const tool = this.get(name);
    if (!tool || typeof tool.setEnabled !== "function") return;
    tool.setEnabled(enabled);
  }
}
