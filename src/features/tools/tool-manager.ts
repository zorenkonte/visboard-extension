export interface AnnotationTool {
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
}

export class ToolManager {
  private readonly tools = new Map<string, AnnotationTool>();

  register(name: string, tool: AnnotationTool): void {
    this.tools.set(name, tool);
  }

  get(name: string): AnnotationTool | null {
    return this.tools.get(name) ?? null;
  }

  toggle(name: string): void {
    const tool = this.get(name);
    if (!tool) return;
    tool.toggle();
  }

  setEnabled(name: string, enabled: boolean): void {
    const tool = this.get(name);
    if (!tool) return;
    tool.setEnabled(enabled);
  }
}