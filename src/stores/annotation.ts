import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  currentToolItem,
  annotationEnabledItem,
  laserColorItem,
  penColorItem,
  penWidthItem,
  shapesColorItem,
  shapesTypeItem,
  currentStickerItem,
} from '../shared/storage';
import { VISBOARD_MESSAGES, type ToolName } from '../shared/messages';
import { STICKER_PACK } from '../features/stickers/controller';

const availableTools: ToolName[] = ['laser', 'pen', 'shapes', 'stickers'];

function normalizeHexColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ff2b6e';
}

export const useAnnotationStore = defineStore('annotation', () => {
  const ready = ref(false);
  const enabled = ref(false);
  const currentTool = ref<ToolName>('laser');
  const laserColor = ref('#ff2b6e');
  const penColor = ref('#3b82f6');
  const penWidth = ref(3);
  const shapesColor = ref('#f97316');
  const shapesType = ref<'rect' | 'circle' | 'line'>('rect');
  const currentSticker = ref('😂');

  const toolOptions = computed(() => availableTools);
  const activeToolLabel = computed(() => currentTool.value.toUpperCase());
  const stickers = computed(() => STICKER_PACK);

  async function load(): Promise<void> {
    const [storedEnabled, storedTool, storedLaserColor, storedPenColor, storedPenWidth, storedShapesColor, storedShapesType, storedSticker] = await Promise.all([
      annotationEnabledItem.getValue(),
      currentToolItem.getValue(),
      laserColorItem.getValue(),
      penColorItem.getValue(),
      penWidthItem.getValue(),
      shapesColorItem.getValue(),
      shapesTypeItem.getValue(),
      currentStickerItem.getValue(),
    ]);

    enabled.value = storedEnabled;
    currentTool.value = storedTool;
    laserColor.value = normalizeHexColor(storedLaserColor);
    penColor.value = normalizeHexColor(storedPenColor);
    penWidth.value = storedPenWidth;
    shapesColor.value = normalizeHexColor(storedShapesColor);
    shapesType.value = storedShapesType;
    currentSticker.value = storedSticker;
    ready.value = true;
  }

  async function setEnabled(nextEnabled: boolean): Promise<void> {
    enabled.value = nextEnabled;
    await annotationEnabledItem.setValue(nextEnabled);
    await browser.runtime.sendMessage({
      type: VISBOARD_MESSAGES.SET_ACTIVE,
      enabled: nextEnabled,
    });
  }

  async function toggleEnabled(): Promise<void> {
    await setEnabled(!enabled.value);
  }

  async function setTool(tool: ToolName): Promise<void> {
    currentTool.value = tool;
    await currentToolItem.setValue(tool);
    await browser.runtime.sendMessage({
      type: VISBOARD_MESSAGES.SET_TOOL,
      tool,
    });
  }

  async function setLaserColor(nextColor: string): Promise<void> {
    const normalized = normalizeHexColor(nextColor);
    laserColor.value = normalized;
    await laserColorItem.setValue(normalized);
    await browser.runtime.sendMessage({ type: VISBOARD_MESSAGES.SETTINGS_UPDATED });
  }

  async function setPenColor(nextColor: string): Promise<void> {
    const normalized = normalizeHexColor(nextColor);
    penColor.value = normalized;
    await penColorItem.setValue(normalized);
    await browser.runtime.sendMessage({ type: VISBOARD_MESSAGES.SETTINGS_UPDATED });
  }

  async function setPenWidth(nextWidth: number): Promise<void> {
    penWidth.value = nextWidth;
    await penWidthItem.setValue(nextWidth);
    await browser.runtime.sendMessage({ type: VISBOARD_MESSAGES.SETTINGS_UPDATED });
  }

  async function setShapesColor(nextColor: string): Promise<void> {
    const normalized = normalizeHexColor(nextColor);
    shapesColor.value = normalized;
    await shapesColorItem.setValue(normalized);
    await browser.runtime.sendMessage({ type: VISBOARD_MESSAGES.SETTINGS_UPDATED });
  }

  async function setShapesType(nextType: 'rect' | 'circle' | 'line'): Promise<void> {
    shapesType.value = nextType;
    await shapesTypeItem.setValue(nextType);
    await browser.runtime.sendMessage({ type: VISBOARD_MESSAGES.SETTINGS_UPDATED });
  }

  async function setCurrentSticker(nextSticker: string): Promise<void> {
    currentSticker.value = nextSticker;
    await currentStickerItem.setValue(nextSticker);
    await browser.runtime.sendMessage({ type: VISBOARD_MESSAGES.SETTINGS_UPDATED });
  }

  return {
    ready,
    enabled,
    currentTool,
    laserColor,
    penColor,
    penWidth,
    shapesColor,
    shapesType,
    currentSticker,
    toolOptions,
    activeToolLabel,
    stickers,
    load,
    setEnabled,
    toggleEnabled,
    setTool,
    setLaserColor,
    setPenColor,
    setPenWidth,
    setShapesColor,
    setShapesType,
    setCurrentSticker,
  };
});