import { storage } from '#imports';
import type { ToolName } from './messages';

export const DEFAULT_LASER_COLOR = '#ff2b6e';
export const DEFAULT_PEN_COLOR = '#3b82f6';
export const DEFAULT_SHAPES_COLOR = '#f97316';
export const DEFAULT_SHAPES_TYPE = 'rect' as const;
export const DEFAULT_STICKER = '😂';

export const annotationEnabledItem = storage.defineItem<boolean>('local:annotationEnabled', {
  fallback: false,
});

export const currentToolItem = storage.defineItem<ToolName>('local:currentTool', {
  fallback: 'laser',
});

export const laserColorItem = storage.defineItem<string>('local:laserColor', {
  fallback: DEFAULT_LASER_COLOR,
});

export const penColorItem = storage.defineItem<string>('local:penColor', {
  fallback: DEFAULT_PEN_COLOR,
});

export const penWidthItem = storage.defineItem<number>('local:penWidth', {
  fallback: 3,
});

export const shapesColorItem = storage.defineItem<string>('local:shapesColor', {
  fallback: DEFAULT_SHAPES_COLOR,
});

export const shapesTypeItem = storage.defineItem<'rect' | 'circle' | 'line'>('local:shapesType', {
  fallback: DEFAULT_SHAPES_TYPE,
});

export const currentStickerItem = storage.defineItem<string>('local:currentSticker', {
  fallback: DEFAULT_STICKER,
});