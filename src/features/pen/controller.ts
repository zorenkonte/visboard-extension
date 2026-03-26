import type { AnnotationTool } from '../tools/tool-manager';

export class PenController implements AnnotationTool {
  private penActive = false;
  private svgContainer: SVGSVGElement | null = null;
  private pathElement: SVGPathElement | null = null;
  private isDrawing = false;
  private penColor: string;
  private penWidth: number;

  constructor(initialColor: string = '#3b82f6', initialWidth: number = 3) {
    this.penColor = initialColor;
    this.penWidth = initialWidth;

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  toggle(): void {
    this.setEnabled(!this.penActive);
  }

  setEnabled(enabled: boolean): void {
    this.penActive = enabled;

    if (enabled) {
      this.createPenOverlay();
      document.body.style.cursor = 'crosshair';
      this.addListeners();
      return;
    }

    this.isDrawing = false;
    this.removeListeners();
    document.body.style.cursor = '';
    this.removePenOverlay();
  }

  setPenColor(nextColor: string): void {
    if (typeof nextColor !== 'string') return;
    this.penColor = nextColor;
    if (this.pathElement) {
      this.pathElement.setAttribute('stroke', this.penColor);
    }
  }

  setColor(nextColor: string): void {
    this.setPenColor(nextColor);
  }

  setPenWidth(nextWidth: number): void {
    if (typeof nextWidth !== 'number' || nextWidth <= 0) return;
    this.penWidth = nextWidth;
    if (this.pathElement) {
      this.pathElement.setAttribute('stroke-width', String(this.penWidth));
    }
  }

  setWidth(nextWidth: number): void {
    this.setPenWidth(nextWidth);
  }

  private createPenOverlay(): void {
    if (this.svgContainer) return;

    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgContainer.id = 'pen-overlay-svg';
    this.svgContainer.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2147483647';

    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hitArea.setAttribute('x', '0');
    hitArea.setAttribute('y', '0');
    hitArea.setAttribute('width', '100%');
    hitArea.setAttribute('height', '100%');
    hitArea.setAttribute('fill', 'transparent');
    hitArea.setAttribute('pointer-events', 'all');
    this.svgContainer.appendChild(hitArea);

    document.body.appendChild(this.svgContainer);
  }

  private removePenOverlay(): void {
    this.svgContainer?.remove();
    this.svgContainer = null;
    this.pathElement = null;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.penActive || !this.isDrawing || !this.pathElement) return;

    const x = event.clientX;
    const y = event.clientY;
    const d = this.pathElement.getAttribute('d') || '';
    this.pathElement.setAttribute('d', `${d} L${x},${y}`);
  }

  private handlePointerDown(event: PointerEvent): void {
    if (!this.penActive || event.button !== 0) return;

    this.isDrawing = true;

    this.pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.pathElement.setAttribute('d', `M${event.clientX},${event.clientY}`);
    this.pathElement.setAttribute('stroke', this.penColor);
    this.pathElement.setAttribute('stroke-width', String(this.penWidth));
    this.pathElement.setAttribute('fill', 'none');
    this.pathElement.setAttribute('stroke-linecap', 'round');
    this.pathElement.setAttribute('stroke-linejoin', 'round');
    this.svgContainer?.appendChild(this.pathElement);
  }

  private handlePointerUp(): void {
    this.isDrawing = false;
    this.pathElement = null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.penActive || event.key !== 'Escape') return;
    this.setEnabled(false);
  }

  private addListeners(): void {
    window.addEventListener('pointermove', this.handlePointerMove, true);
    window.addEventListener('pointerdown', this.handlePointerDown, true);
    window.addEventListener('pointerup', this.handlePointerUp, true);
    window.addEventListener('pointercancel', this.handlePointerUp, true);
    window.addEventListener('keydown', this.handleKeyDown, true);
  }

  private removeListeners(): void {
    window.removeEventListener('pointermove', this.handlePointerMove, true);
    window.removeEventListener('pointerdown', this.handlePointerDown, true);
    window.removeEventListener('pointerup', this.handlePointerUp, true);
    window.removeEventListener('pointercancel', this.handlePointerUp, true);
    window.removeEventListener('keydown', this.handleKeyDown, true);
  }
}
