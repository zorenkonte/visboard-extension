import type { AnnotationTool } from '../tools/tool-manager';

export const STICKER_PACK = ['😂', '❤️', '👍', '🔥', '⭐', '🎉', '😍', '🚀', '💯', '😎', '🤔', '😭'];

export class StickersController implements AnnotationTool {
  private stickersActive = false;
  private containerElement: HTMLDivElement | null = null;
  private currentSticker: string = '😂';

  constructor(initialSticker: string = '😂') {
    this.currentSticker = initialSticker;
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  toggle(): void {
    this.setEnabled(!this.stickersActive);
  }

  setEnabled(enabled: boolean): void {
    this.stickersActive = enabled;

    if (enabled) {
      this.createStickersOverlay();
      document.body.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Ctext y=%2220%22 font-size=%2220%22%3E' +
        encodeURIComponent(this.currentSticker) +
        '%3C/text%3E%3C/svg%3E") 0 0, auto';
      this.addListeners();
      return;
    }

    this.removeListeners();
    document.body.style.cursor = '';
    this.removeStickersOverlay();
  }

  setCurrentSticker(sticker: string): void {
    if (typeof sticker !== 'string' || !STICKER_PACK.includes(sticker)) return;
    this.currentSticker = sticker;
  }

  private createStickersOverlay(): void {
    if (this.containerElement) return;

    this.containerElement = document.createElement('div');
    this.containerElement.id = 'stickers-overlay';
    this.containerElement.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646';

    document.body.appendChild(this.containerElement);
  }

  private removeStickersOverlay(): void {
    // Clear all placed stickers on disable
    // (Optional: could preserve them with a flag)
    const stickers = document.querySelectorAll('.visboard-sticker');
    stickers.forEach((s) => s.remove());

    this.containerElement?.remove();
    this.containerElement = null;
  }

  private handleClick(event: MouseEvent): void {
    if (!this.stickersActive) return;

    const stickerEl = document.createElement('div');
    stickerEl.classList.add('visboard-sticker');
    stickerEl.textContent = this.currentSticker;
    stickerEl.style.cssText =
      `position:fixed;left:${event.clientX}px;top:${event.clientY}px;font-size:32px;pointer-events:none;user-select:none;z-index:2147483647;animation:fadeInScale 0.3s ease-out;`;

    // Add fade-in animation via style tag (since we're not using CSS modules)
    if (!document.getElementById('stickers-animation-style')) {
      const style = document.createElement('style');
      style.id = 'stickers-animation-style';
      style.textContent = `
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(stickerEl);

    // Auto-fade out and remove after 3 seconds
    setTimeout(() => {
      stickerEl.style.animation = 'fadeInScale 0.3s ease-in reverse';
      setTimeout(() => stickerEl.remove(), 300);
    }, 3000);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.stickersActive || event.key !== 'Escape') return;
    this.setEnabled(false);
  }

  private addListeners(): void {
    window.addEventListener('click', this.handleClick, true);
    window.addEventListener('keydown', this.handleKeyDown, true);
  }

  private removeListeners(): void {
    window.removeEventListener('click', this.handleClick, true);
    window.removeEventListener('keydown', this.handleKeyDown, true);
  }
}
