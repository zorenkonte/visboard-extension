export const VISBOARD_MESSAGES = {
  TOGGLE_ACTIVE: 'visboard:toggle-active',
  SET_ACTIVE: 'visboard:set-active',
  SET_TOOL: 'visboard:set-tool',
  SETTINGS_UPDATED: 'visboard:settings-updated',
  GET_STORAGE: 'visboard:get-storage',
  SET_STORAGE: 'visboard:set-storage',
  STORAGE_CHANGED: 'visboard:storage-changed',
  STORAGE_VALUE: 'visboard:storage-value',
} as const;

export type ToolName = 'laser' | 'pen' | 'shapes' | 'stickers';

export interface ToggleActiveMessage {
  type: typeof VISBOARD_MESSAGES.TOGGLE_ACTIVE;
}

export interface SetActiveMessage {
  type: typeof VISBOARD_MESSAGES.SET_ACTIVE;
  enabled: boolean;
}

export interface SetToolMessage {
  type: typeof VISBOARD_MESSAGES.SET_TOOL;
  tool: ToolName;
}

export interface SettingsUpdatedMessage {
  type: typeof VISBOARD_MESSAGES.SETTINGS_UPDATED;
}

export interface GetStorageMessage {
  type: typeof VISBOARD_MESSAGES.GET_STORAGE;
  key: string;
}

export interface SetStorageMessage {
  type: typeof VISBOARD_MESSAGES.SET_STORAGE;
  key: string;
  value: any;
}

export interface StorageChangedMessage {
  type: typeof VISBOARD_MESSAGES.STORAGE_CHANGED;
  key: string;
  value: any;
}

export interface StorageValueMessage {
  type: typeof VISBOARD_MESSAGES.STORAGE_VALUE;
  key: string;
  value: any;
}

export type VisboardMessage =
  | ToggleActiveMessage
  | SetActiveMessage
  | SetToolMessage
  | SettingsUpdatedMessage
  | GetStorageMessage
  | SetStorageMessage
  | StorageChangedMessage
  | StorageValueMessage;

export function isVisboardMessage(value: unknown): value is VisboardMessage {
  return !!value && typeof value === 'object' && 'type' in value;
}