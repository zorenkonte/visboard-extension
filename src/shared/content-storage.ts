import { VISBOARD_MESSAGES, type VisboardMessage } from './messages';
import type { ToolName } from './messages';
import { DEFAULT_TOOL_SHORTCUTS } from './shortcuts';
import {
  DEFAULT_LASER_COLOR,
  DEFAULT_PEN_COLOR,
  DEFAULT_SHAPES_COLOR,
  DEFAULT_SHAPES_TYPE,
  DEFAULT_STICKER,
} from './storage';

interface StorageItem<T> {
  getValue(): Promise<T>;
  setValue(value: T): Promise<void>;
  watch(callback: (value: T) => void): () => void;
}

class ContentScriptStorageItem<T> implements StorageItem<T> {
  private key: string;
  private fallback: T;
  private watchers: Array<(value: T) => void> = [];
  private currentValue: T | undefined;

  constructor(key: string, fallback: T) {
    this.key = key;
    this.fallback = fallback;

    // Listen for storage changes from background script
    browser.runtime.onMessage.addListener((message: VisboardMessage) => {
      if (message.type === VISBOARD_MESSAGES.STORAGE_CHANGED && (message as any).key === this.key) {
        this.currentValue = (message as any).value;
        this.watchers.forEach((callback) => callback(this.currentValue!));
      }
    });

    // Initial load of value from background
    void this.loadValue();
  }

  private async loadValue(): Promise<void> {
    const response = await browser.runtime.sendMessage({
      type: VISBOARD_MESSAGES.GET_STORAGE,
      key: this.key,
    } as VisboardMessage);
    if (response?.type === VISBOARD_MESSAGES.STORAGE_VALUE) {
      this.currentValue = response.value ?? this.fallback;
    } else {
      this.currentValue = this.fallback;
    }
    this.watchers.forEach((callback) => callback(this.currentValue!));
  }

  async getValue(): Promise<T> {
    // If we have a cached value, return it
    if (this.currentValue !== undefined) {
      return this.currentValue;
    }
    // Otherwise, request from background
    const response = await browser.runtime.sendMessage({
      type: VISBOARD_MESSAGES.GET_STORAGE,
      key: this.key,
    } as VisboardMessage);
    const value = response?.type === VISBOARD_MESSAGES.STORAGE_VALUE ? response.value : this.fallback;
    this.currentValue = value;
    return value;
  }

  async setValue(value: T): Promise<void> {
    this.currentValue = value;
    await browser.runtime.sendMessage({
      type: VISBOARD_MESSAGES.SET_STORAGE,
      key: this.key,
      value,
    } as VisboardMessage);
    this.watchers.forEach((callback) => callback(value));
  }

  watch(callback: (value: T) => void): () => void {
    this.watchers.push(callback);
    // Call immediately with current value if available
    if (this.currentValue !== undefined) {
      callback(this.currentValue);
    }
    return () => {
      this.watchers = this.watchers.filter((w) => w !== callback);
    };
  }
}

// Export storage items for content scripts
export const annotationEnabledItem = new ContentScriptStorageItem<boolean>(
  'local:annotationEnabled',
  false,
);

export const currentToolItem = new ContentScriptStorageItem<ToolName>(
  'local:currentTool',
  'laser',
);

export const activeToolItem = new ContentScriptStorageItem<ToolName | null>(
  'local:activeTool',
  null,
);

export const toolShortcutsItem = new ContentScriptStorageItem<Record<ToolName, string>>(
  'local:toolShortcuts',
  DEFAULT_TOOL_SHORTCUTS,
);

export const laserColorItem = new ContentScriptStorageItem<string>(
  'local:laserColor',
  DEFAULT_LASER_COLOR,
);

export const penColorItem = new ContentScriptStorageItem<string>(
  'local:penColor',
  DEFAULT_PEN_COLOR,
);

export const penWidthItem = new ContentScriptStorageItem<number>('local:penWidth', 3);

export const shapesColorItem = new ContentScriptStorageItem<string>(
  'local:shapesColor',
  DEFAULT_SHAPES_COLOR,
);

export const shapesTypeItem = new ContentScriptStorageItem<'rect' | 'circle' | 'line'>(
  'local:shapesType',
  DEFAULT_SHAPES_TYPE,
);

export const currentStickerItem = new ContentScriptStorageItem<string>(
  'local:currentSticker',
  DEFAULT_STICKER,
);
