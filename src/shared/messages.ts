export const VISBOARD_MESSAGES = {
  TOGGLE_ACTIVE: 'visboard:toggle-active',
  SET_ACTIVE: 'visboard:set-active',
  SET_TOOL: 'visboard:set-tool',
  SETTINGS_UPDATED: 'visboard:settings-updated',
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

export type VisboardMessage =
  | ToggleActiveMessage
  | SetActiveMessage
  | SetToolMessage
  | SettingsUpdatedMessage;

export function isVisboardMessage(value: unknown): value is VisboardMessage {
  return !!value && typeof value === 'object' && 'type' in value;
}