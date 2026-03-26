import { DECAY_LENGTH, DECAY_TIME } from "./config";
import { easeOut } from "./math";
import { LaserPointer } from "./pointer";

export class Trail {
  constructor() {
    this.pointer = null;
  }

  startPath(x, y) {
    this.pointer = new LaserPointer({
      simplify: 0,
      streamline: 0.4,
      sizeMapping: (context) => {
        const t = Math.max(0, 1 - (performance.now() - context.pressure) / DECAY_TIME);
        const l =
          (DECAY_LENGTH - Math.min(DECAY_LENGTH, context.totalLength - context.currentIndex)) /
          DECAY_LENGTH;
        return Math.min(easeOut(l), easeOut(t));
      },
    });

    this.pointer.addPoint([x, y, performance.now()]);
  }

  addPointToPath(x, y) {
    if (!this.pointer) return;
    this.pointer.addPoint([x, y, performance.now()]);
  }

  endPath() {
    if (!this.pointer) return;
    this.pointer.close();
  }

  isAlive() {
    if (!this.pointer) return false;
    return this.pointer.getStrokeOutline().length > 0;
  }
}
