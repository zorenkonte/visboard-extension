import { add, angle, dist, mag, norm, normAngle, plerp, rot, runLength, smul, sub, type Point3 } from './math';

interface SizeContext {
  pressure: number;
  runningLength: number;
  currentIndex: number;
  totalLength: number;
}

interface LaserPointerOptions {
  size?: number;
  streamline?: number;
  simplify?: number;
  keepHead?: boolean;
  sizeMapping?: (context: SizeContext) => number;
}

export class LaserPointer {
  static defaults: Required<LaserPointerOptions> = {
    size: 2,
    streamline: 0.45,
    simplify: 0,
    keepHead: false,
    sizeMapping: () => 1,
  };

  static constants = {
    cornerDetectionMaxAngle: 75,
    cornerDetectionVariance: (speed: number) => (speed > 35 ? 0.5 : 1),
    maxTailLength: 50,
  };

  private options: Required<LaserPointerOptions>;
  private readonly originalPoints: Point3[] = [];
  private readonly stablePoints: Point3[] = [];
  private tailPoints: Point3[] = [];
  private isFresh = true;
  private isClosed = false;

  constructor(options: LaserPointerOptions = {}) {
    this.options = { ...LaserPointer.defaults, ...options };
  }

  get lastPoint(): Point3 {
    return this.tailPoints[this.tailPoints.length - 1] ?? this.stablePoints[this.stablePoints.length - 1];
  }

  addPoint(point: Point3): void {
    const lastPoint = this.originalPoints[this.originalPoints.length - 1];
    if (lastPoint && lastPoint[0] === point[0] && lastPoint[1] === point[1]) {
      return;
    }

    this.originalPoints.push(point);

    if (this.isFresh) {
      this.isFresh = false;
      this.stablePoints.push(point);
      return;
    }

    let nextPoint = point;
    if (this.options.streamline > 0) {
      nextPoint = plerp(this.lastPoint, nextPoint, 1 - this.options.streamline);
    }

    this.tailPoints.push(nextPoint);

    if (runLength(this.tailPoints) > LaserPointer.constants.maxTailLength) {
      this.stabilizeTail();
    }
  }

  close(): void {
    this.stabilizeTail();
    this.isClosed = true;
    this.options.keepHead = false;
  }

  private stabilizeTail(): void {
    this.stablePoints.push(...this.tailPoints);
    this.tailPoints = [];
  }

  private getSize(sizeOverride: number | undefined, pressure: number, index: number, totalLength: number, runningLength: number): number {
    return (sizeOverride ?? this.options.size) * this.options.sizeMapping({
      pressure,
      runningLength,
      currentIndex: index,
      totalLength,
    });
  }

  getStrokeOutline(sizeOverride?: number): Point3[] {
    if (this.isFresh) return [];

    const points = [...this.stablePoints, ...this.tailPoints];
    const length = points.length;

    if (length === 0) return [];

    if (length === 1) {
      const center = points[0];
      const size = this.getSize(sizeOverride, center[2], 0, length, 0);
      if (size < 0.5) return [];
      const contour: Point3[] = [];
      for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) {
        contour.push(add(center, smul(rot([1, 0, 0], theta), size)));
      }
      contour.push(add(center, smul([1, 0, 0], size)));
      return contour;
    }

    if (length === 2) {
      const current = points[0];
      const next = points[1];
      const currentSize = this.getSize(sizeOverride, current[2], 0, length, 0);
      const nextSize = this.getSize(sizeOverride, next[2], 0, length, 0);
      if (currentSize < 0.5 || nextSize < 0.5) return [];

      const contour: Point3[] = [];
      const pointerAngle = angle(current, [current[0], current[1] - 100, current[2]], next);
      for (let theta = pointerAngle; theta <= Math.PI + pointerAngle; theta += Math.PI / 16) {
        contour.push(add(current, smul(rot([1, 0, 0], theta), currentSize)));
      }
      for (let theta = Math.PI + pointerAngle; theta <= Math.PI * 2 + pointerAngle; theta += Math.PI / 16) {
        contour.push(add(next, smul(rot([1, 0, 0], theta), nextSize)));
      }
      contour.push(contour[0]);
      return contour;
    }

    const forwardPoints: Point3[] = [];
    const backwardPoints: Point3[] = [];
    let speed = 0;
    let previousSpeed = 0;
    let visibleStartIndex = 0;
    let runningLength = 0;

    for (let index = 1; index < length - 1; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const next = points[index + 1];

      const pressure = current[2];
      const distance = dist(previous, current);
      runningLength += distance;
      speed = previousSpeed + (distance - previousSpeed) * 0.2;

      const currentSize = this.getSize(sizeOverride, pressure, index, length, runningLength);
      if (currentSize === 0) {
        visibleStartIndex = index + 1;
        continue;
      }

      const directionPrevCurrent = norm(sub(previous, current));
      const directionNextCurrent = norm(sub(next, current));
      const perp1PrevCurrent = rot(directionPrevCurrent, Math.PI / 2);
      const perp2PrevCurrent = rot(directionPrevCurrent, -Math.PI / 2);
      const perp1NextCurrent = rot(directionNextCurrent, Math.PI / 2);
      const perp2NextCurrent = rot(directionNextCurrent, -Math.PI / 2);

      const tangentForward = add(perp1PrevCurrent, perp2NextCurrent);
      const tangentBackward = add(perp2PrevCurrent, perp1NextCurrent);

      const pointForward = add(current, smul(mag(tangentForward) === 0 ? directionPrevCurrent : norm(tangentForward), currentSize));
      const pointBackward = add(current, smul(mag(tangentBackward) === 0 ? directionNextCurrent : norm(tangentBackward), currentSize));

      const currentAngle = normAngle(angle(current, previous, next));
      const thresholdAngle =
        (LaserPointer.constants.cornerDetectionMaxAngle / 180) *
        Math.PI *
        LaserPointer.constants.cornerDetectionVariance(speed);

      if (Math.abs(currentAngle) < thresholdAngle) {
        const turnAngle = Math.abs(normAngle(Math.PI - currentAngle));
        if (turnAngle === 0) {
          continue;
        }

        if (currentAngle < 0) {
          backwardPoints.push(add(current, smul(perp2PrevCurrent, currentSize)), pointBackward);
          for (let theta = 0; theta <= turnAngle; theta += turnAngle / 4) {
            forwardPoints.push(add(current, rot(smul(perp1PrevCurrent, currentSize), theta)));
          }
          for (let theta = turnAngle; theta >= 0; theta -= turnAngle / 4) {
            backwardPoints.push(add(current, rot(smul(perp1PrevCurrent, currentSize), theta)));
          }
          backwardPoints.push(pointBackward, add(current, smul(perp1NextCurrent, currentSize)));
        } else {
          forwardPoints.push(add(current, smul(perp1PrevCurrent, currentSize)), pointForward);
          for (let theta = 0; theta <= turnAngle; theta += turnAngle / 4) {
            backwardPoints.push(add(current, rot(smul(perp1PrevCurrent, -currentSize), -theta)));
          }
          for (let theta = turnAngle; theta >= 0; theta -= turnAngle / 4) {
            forwardPoints.push(add(current, rot(smul(perp1PrevCurrent, -currentSize), -theta)));
          }
          forwardPoints.push(pointForward, add(current, smul(perp2NextCurrent, currentSize)));
        }
      } else {
        forwardPoints.push(pointForward);
        backwardPoints.push(pointBackward);
      }

      previousSpeed = speed;
    }

    if (visibleStartIndex >= length - 2) {
      if (this.options.keepHead) {
        const center = points[length - 1];
        const contour: Point3[] = [];
        for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) {
          contour.push(add(center, smul(rot([1, 0, 0], theta), this.options.size)));
        }
        contour.push(add(center, smul([1, 0, 0], this.options.size)));
        return contour;
      }
      return [];
    }

    const first = points[visibleStartIndex];
    const second = points[visibleStartIndex + 1];
    const penultimate = points[length - 2];
    const ultimate = points[length - 1];

    const directionFirstSecond = norm(sub(second, first));
    const directionPenultimateUltimate = norm(sub(penultimate, ultimate));
    const perpFirstSecond = rot(directionFirstSecond, -Math.PI / 2);
    const perpPenultimateUltimate = rot(directionPenultimateUltimate, Math.PI / 2);

    const startCapSize = this.getSize(sizeOverride, first[2], 0, length, 0);
    const endCapSize = this.options.keepHead
      ? this.options.size
      : this.getSize(sizeOverride, penultimate[2], length - 2, length, runningLength);

    const startCap: Point3[] = [];
    const endCap: Point3[] = [];

    if (startCapSize > 0.1) {
      for (let theta = 0; theta <= Math.PI; theta += Math.PI / 16) {
        startCap.unshift(add(first, rot(smul(perpFirstSecond, startCapSize), -theta)));
      }
      startCap.unshift(add(first, smul(perpFirstSecond, -startCapSize)));
    } else {
      startCap.push(first);
    }

    for (let theta = 0; theta <= Math.PI * 3; theta += Math.PI / 16) {
      endCap.push(add(ultimate, rot(smul(perpPenultimateUltimate, -endCapSize), -theta)));
    }

    const strokeOutline = [
      ...startCap,
      ...forwardPoints,
      ...endCap.reverse(),
      ...backwardPoints.reverse(),
    ];

    if (startCap.length > 0) {
      strokeOutline.push(startCap[0]);
    }

    return strokeOutline;
  }
}