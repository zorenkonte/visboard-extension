import type { AnnotationTool } from '../tools/tool-manager';

export class ShapesController implements AnnotationTool {
  private shapesActive = false;
  private svgContainer: SVGSVGElement | null = null;
  private currentShape: SVGElement | null = null;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private shapeColor: string;
  private shapeType: 'rect' | 'circle' | 'line' = 'rect';

  constructor(initialColor: string = '#f97316') {
    this.shapeColor = initialColor;

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  toggle(): void {
    this.setEnabled(!this.shapesActive);
  }

  setEnabled(enabled: boolean): void {
    this.shapesActive = enabled;

    if (enabled) {
      this.createShapesOverlay();
      document.body.style.cursor = 'crosshair';
      this.addListeners();
      return;
    }

    this.isDrawing = false;
    this.removeListeners();
    document.body.style.cursor = '';
    this.removeShapesOverlay();
  }

  setShapeColor(nextColor: string): void {
    if (typeof nextColor !== 'string') return;
    this.shapeColor = nextColor;
  }

  setShapeType(shapeType: 'rect' | 'circle' | 'line'): void {
    this.shapeType = shapeType;
  }

  private createShapesOverlay(): void {
    if (this.svgContainer) return;

    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgContainer.id = 'shapes-overlay-svg';
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

  private removeShapesOverlay(): void {
    this.svgContainer?.remove();
    this.svgContainer = null;
    this.currentShape = null;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.shapesActive || !this.isDrawing || !this.currentShape) return;

    const currentX = event.clientX;
    const currentY = event.clientY;
    const width = currentX - this.startX;
    const height = currentY - this.startY;

    if (this.shapeType === 'rect') {
      this.currentShape.setAttribute('x', String(this.startX));
      this.currentShape.setAttribute('y', String(this.startY));
      this.currentShape.setAttribute('width', String(Math.abs(width)));
      this.currentShape.setAttribute('height', String(Math.abs(height)));
    } else if (this.shapeType === 'circle') {
      const radius = Math.sqrt(width ** 2 + height ** 2) / 2;
      this.currentShape.setAttribute('r', String(radius));
      this.currentShape.setAttribute('cx', String(this.startX + width / 2));
      this.currentShape.setAttribute('cy', String(this.startY + height / 2));
    } else if (this.shapeType === 'line') {
      this.currentShape.setAttribute('x2', String(currentX));
      this.currentShape.setAttribute('y2', String(currentY));
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    if (!this.shapesActive || event.button !== 0) return;

    this.isDrawing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    if (this.shapeType === 'rect') {
      this.currentShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      this.currentShape.setAttribute('x', String(this.startX));
      this.currentShape.setAttribute('y', String(this.startY));
      this.currentShape.setAttribute('width', '0');
      this.currentShape.setAttribute('height', '0');
    } else if (this.shapeType === 'circle') {
      this.currentShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      this.currentShape.setAttribute('cx', String(this.startX));
      this.currentShape.setAttribute('cy', String(this.startY));
      this.currentShape.setAttribute('r', '0');
    } else if (this.shapeType === 'line') {
      this.currentShape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this.currentShape.setAttribute('x1', String(this.startX));
      this.currentShape.setAttribute('y1', String(this.startY));
      this.currentShape.setAttribute('x2', String(this.startX));
      this.currentShape.setAttribute('y2', String(this.startY));
    }

    this.currentShape?.setAttribute('stroke', this.shapeColor);
    this.currentShape?.setAttribute('stroke-width', '2');
    this.currentShape?.setAttribute('fill', 'none');
    if (this.currentShape) {
      this.svgContainer?.appendChild(this.currentShape);
    }
  }

  private handlePointerUp(): void {
    this.isDrawing = false;
    this.currentShape = null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.shapesActive || event.key !== 'Escape') return;
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
