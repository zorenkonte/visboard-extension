import { DECAY_LENGTH, DECAY_TIME } from './config';
import { easeOut } from './math';
import { LaserPointer } from './pointer';

export class Trail {
  pointer: LaserPointer | null = null;

  startPath(x: number, y: number): void {
    this.pointer = new LaserPointer({
      simplify: 0,
      streamline: 0.4,
      sizeMapping: (context) => {
        const timeFactor = Math.max(0, 1 - (performance.now() - context.pressure) / DECAY_TIME);
        const lengthFactor =
          (DECAY_LENGTH - Math.min(DECAY_LENGTH, context.totalLength - context.currentIndex)) /
          DECAY_LENGTH;

        return Math.min(easeOut(lengthFactor), easeOut(timeFactor));
      },
    });

    this.pointer.addPoint([x, y, performance.now()]);
  }

  addPointToPath(x: number, y: number): void {
    if (!this.pointer) return;
    this.pointer.addPoint([x, y, performance.now()]);
  }

  endPath(): void {
    this.pointer?.close();
  }

  isAlive(): boolean {
    if (!this.pointer) return false;
    return this.pointer.getStrokeOutline().length > 0;
  }
}