import {
  add,
  angle,
  dist,
  mag,
  norm,
  normAngle,
  plerp,
  rot,
  runLength,
  smul,
  sub,
} from "./math";

export class LaserPointer {
  static defaults = {
    size: 2,
    streamline: 0.45,
    simplify: 0,
    keepHead: false,
    sizeMapping: () => 1,
  };

  static constants = {
    cornerDetectionMaxAngle: 75,
    cornerDetectionVariance: (speed) => (speed > 35 ? 0.5 : 1),
    maxTailLength: 50,
  };

  constructor(options = {}) {
    this.options = { ...LaserPointer.defaults, ...options };
    this.originalPoints = [];
    this.stablePoints = [];
    this.tailPoints = [];
    this.isFresh = true;
    this.isClosed = false;
  }

  get lastPoint() {
    return (
      this.tailPoints[this.tailPoints.length - 1] ??
      this.stablePoints[this.stablePoints.length - 1]
    );
  }

  addPoint(point) {
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

  close() {
    this.stabilizeTail();
    this.isClosed = true;
    this.options.keepHead = false;
  }

  stabilizeTail() {
    this.stablePoints.push(...this.tailPoints);
    this.tailPoints = [];
  }

  getSize(sizeOverride, pressure, index, totalLength, runningLength) {
    return (
      (sizeOverride ?? this.options.size) *
      this.options.sizeMapping({
        pressure,
        runningLength,
        currentIndex: index,
        totalLength,
      })
    );
  }

  getStrokeOutline(sizeOverride) {
    if (this.isFresh) return [];

    const points = [...this.stablePoints, ...this.tailPoints];
    const len = points.length;

    if (len === 0) return [];

    if (len === 1) {
      const c = points[0];
      const size = this.getSize(sizeOverride, c[2], 0, len, 0);
      if (size < 0.5) return [];
      const ps = [];
      for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) {
        ps.push(add(c, smul(rot([1, 0, 0], theta), size)));
      }
      ps.push(add(c, smul([1, 0, 0], size)));
      return ps;
    }

    if (len === 2) {
      const c = points[0];
      const n = points[1];
      const cSize = this.getSize(sizeOverride, c[2], 0, len, 0);
      const nSize = this.getSize(sizeOverride, n[2], 0, len, 0);
      if (cSize < 0.5 || nSize < 0.5) return [];

      const ps = [];
      const pAngle = angle(c, [c[0], c[1] - 100, c[2]], n);
      for (let theta = pAngle; theta <= Math.PI + pAngle; theta += Math.PI / 16) {
        ps.push(add(c, smul(rot([1, 0, 0], theta), cSize)));
      }
      for (
        let theta = Math.PI + pAngle;
        theta <= Math.PI * 2 + pAngle;
        theta += Math.PI / 16
      ) {
        ps.push(add(n, smul(rot([1, 0, 0], theta), nSize)));
      }
      ps.push(ps[0]);
      return ps;
    }

    const forwardPoints = [];
    const backwardPoints = [];
    let speed = 0;
    let prevSpeed = 0;
    let visibleStartIndex = 0;
    let runningLength = 0;

    for (let i = 1; i < len - 1; i++) {
      const p = points[i - 1];
      const c = points[i];
      const n = points[i + 1];

      const pressure = c[2];
      const distance = dist(p, c);
      runningLength += distance;
      speed = prevSpeed + (distance - prevSpeed) * 0.2;

      const cSize = this.getSize(sizeOverride, pressure, i, len, runningLength);
      if (cSize === 0) {
        visibleStartIndex = i + 1;
        continue;
      }

      const dirPC = norm(sub(p, c));
      const dirNC = norm(sub(n, c));
      const p1dirPC = rot(dirPC, Math.PI / 2);
      const p2dirPC = rot(dirPC, -Math.PI / 2);
      const p1dirNC = rot(dirNC, Math.PI / 2);
      const p2dirNC = rot(dirNC, -Math.PI / 2);

      const p1PC = add(c, smul(p1dirPC, cSize));
      const p2PC = add(c, smul(p2dirPC, cSize));
      const p1NC = add(c, smul(p1dirNC, cSize));
      const p2NC = add(c, smul(p2dirNC, cSize));

      const ftdir = add(p1dirPC, p2dirNC);
      const btdir = add(p2dirPC, p1dirNC);

      const paPC = add(c, smul(mag(ftdir) === 0 ? dirPC : norm(ftdir), cSize));
      const paNC = add(c, smul(mag(btdir) === 0 ? dirNC : norm(btdir), cSize));

      const cAngle = normAngle(angle(c, p, n));
      const D_ANGLE =
        (LaserPointer.constants.cornerDetectionMaxAngle / 180) *
        Math.PI *
        LaserPointer.constants.cornerDetectionVariance(speed);

      if (Math.abs(cAngle) < D_ANGLE) {
        const tAngle = Math.abs(normAngle(Math.PI - cAngle));
        if (tAngle === 0) {
          continue;
        }

        if (cAngle < 0) {
          backwardPoints.push(p2PC, paNC);
          for (let theta = 0; theta <= tAngle; theta += tAngle / 4) {
            forwardPoints.push(add(c, rot(smul(p1dirPC, cSize), theta)));
          }
          for (let theta = tAngle; theta >= 0; theta -= tAngle / 4) {
            backwardPoints.push(add(c, rot(smul(p1dirPC, cSize), theta)));
          }
          backwardPoints.push(paNC, p1NC);
        } else {
          forwardPoints.push(p1PC, paPC);
          for (let theta = 0; theta <= tAngle; theta += tAngle / 4) {
            backwardPoints.push(add(c, rot(smul(p1dirPC, -cSize), -theta)));
          }
          for (let theta = tAngle; theta >= 0; theta -= tAngle / 4) {
            forwardPoints.push(add(c, rot(smul(p1dirPC, -cSize), -theta)));
          }
          forwardPoints.push(paPC, p2NC);
        }
      } else {
        forwardPoints.push(paPC);
        backwardPoints.push(paNC);
      }

      prevSpeed = speed;
    }

    if (visibleStartIndex >= len - 2) {
      if (this.options.keepHead) {
        const c = points[len - 1];
        const ps = [];
        for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) {
          ps.push(add(c, smul(rot([1, 0, 0], theta), this.options.size)));
        }
        ps.push(add(c, smul([1, 0, 0], this.options.size)));
        return ps;
      }
      return [];
    }

    const first = points[visibleStartIndex];
    const second = points[visibleStartIndex + 1];
    const penultimate = points[len - 2];
    const ultimate = points[len - 1];

    const dirFS = norm(sub(second, first));
    const dirPU = norm(sub(penultimate, ultimate));
    const ppdirFS = rot(dirFS, -Math.PI / 2);
    const ppdirPU = rot(dirPU, Math.PI / 2);

    const startCapSize = this.getSize(sizeOverride, first[2], 0, len, 0);
    const endCapSize = this.options.keepHead
      ? this.options.size
      : this.getSize(sizeOverride, penultimate[2], len - 2, len, runningLength);

    const startCap = [];
    const endCap = [];

    if (startCapSize > 0.1) {
      for (let theta = 0; theta <= Math.PI; theta += Math.PI / 16) {
        startCap.unshift(add(first, rot(smul(ppdirFS, startCapSize), -theta)));
      }
      startCap.unshift(add(first, smul(ppdirFS, -startCapSize)));
    } else {
      startCap.push(first);
    }

    for (let theta = 0; theta <= Math.PI * 3; theta += Math.PI / 16) {
      endCap.push(add(ultimate, rot(smul(ppdirPU, -endCapSize), -theta)));
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
