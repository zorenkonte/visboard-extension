let laserActive = false;
let svgContainer = null;
let animationFrame = null;
let isDrawing = false;
let activePointerId = null;
let currentTrail = null;

const pastTrails = [];
const DECAY_TIME = 1000;
const DECAY_LENGTH = 50;
const LASER_COLOR = "red";
const MIN_POINT_DISTANCE = 0.8;
let pathElement = null;

const laserCursorSVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg viewBox="0 0 24 24" stroke-width="1" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path stroke="#1b1b1f" fill="#fff" d="m7.868 11.113 7.773 7.774a2.359 2.359 0 0 0 1.667.691 2.368 2.368 0 0 0 2.357-2.358c0-.625-.248-1.225-.69-1.667L11.201 7.78 9.558 9.469l-1.69 1.643v.001Zm10.273 3.606-3.333 3.333m-3.25-6.583 2 2m-7-7 3 3M3.664 3.625l1 1M2.529 6.922l1.407-.144m5.735-2.932-1.118.866M4.285 9.823l.758-1.194m1.863-6.207-.13 1.408"/></svg>`,
)}`;

const easeOut = (k) => 1 - Math.pow(1 - k, 4);
const average = (a, b) => (a + b) / 2;

const add = ([ax, ay, ar], [bx, by, br]) => [ax + bx, ay + by, ar + br];
const sub = ([ax, ay, ar], [bx, by, br]) => [ax - bx, ay - by, ar - br];
const smul = ([x, y, r], s) => [x * s, y * s, r * s];
const norm = ([x, y, r]) => {
  const m = Math.sqrt(x ** 2 + y ** 2);
  if (m === 0) return [0, 0, r];
  return [x / m, y / m, r];
};
const rot = ([x, y, r], rad) => [
  Math.cos(rad) * x - Math.sin(rad) * y,
  Math.sin(rad) * x + Math.cos(rad) * y,
  r,
];
const plerp = (a, b, t) => add(a, smul(sub(b, a), t));
const angle = (p, p1, p2) =>
  Math.atan2(p2[1] - p[1], p2[0] - p[0]) -
  Math.atan2(p1[1] - p[1], p1[0] - p[0]);
const normAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const mag = ([x, y]) => Math.sqrt(x ** 2 + y ** 2);
const dist = ([ax, ay], [bx, by]) => Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
const runLength = (ps) => {
  if (ps.length < 2) return 0;
  let len = 0;
  for (let i = 1; i <= ps.length - 1; i++) {
    len += dist(ps[i - 1], ps[i]);
  }
  len += dist(ps[ps.length - 2], ps[ps.length - 1]);
  return len;
};

function getSvgPathFromStroke(points, closed = true) {
  const len = points.length;
  if (len < 4) {
    return ``;
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2,
  )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
    b[1],
    c[1],
  ).toFixed(2)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
      2,
    )} `;
  }

  if (closed) {
    result += "Z";
  }

  return result;
}

class LaserPointer {
  static defaults = {
    size: 2,
    streamline: 0.45,
    simplify: 0,
    keepHead: false,
    sizeMapping: () => 1,
  };

  static constants = {
    cornerDetectionMaxAngle: 75,
    cornerDetectionVariance: (s) => (s > 35 ? 0.5 : 1),
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
    if (lastPoint) {
      if (lastPoint[0] === point[0] && lastPoint[1] === point[1]) return;
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
      const d = dist(p, c);
      runningLength += d;
      speed = prevSpeed + (d - prevSpeed) * 0.2;

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

class Trail {
  constructor() {
    this.pointer = null;
  }

  startPath(x, y) {
    this.pointer = new LaserPointer({
      simplify: 0,
      streamline: 0.4,
      sizeMapping: (c) => {
        const t = Math.max(0, 1 - (performance.now() - c.pressure) / DECAY_TIME);
        const l =
          (DECAY_LENGTH - Math.min(DECAY_LENGTH, c.totalLength - c.currentIndex)) /
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
    const outline = this.pointer.getStrokeOutline();
    return outline.length > 0;
  }
}

function renderAllTrails() {
  if (!pathElement || !svgContainer) return;
  
  const paths = [];

  // Draw past trails
  for (const trail of pastTrails) {
    const outline = trail.pointer.getStrokeOutline();
    const d = getSvgPathFromStroke(outline, true);
    if (d) paths.push(d);
  }

  // Draw current trail
  if (currentTrail && currentTrail.pointer) {
    const outline = currentTrail.pointer.getStrokeOutline();
    const d = getSvgPathFromStroke(outline, true);
    if (d) paths.push(d);
  }

  const svgPaths = paths.join(" ").trim();
  pathElement.setAttribute("d", svgPaths);
}

function ensureAnimation() {
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(tick);
  }
}

function tick() {
  animationFrame = null;

  renderAllTrails();

  // Clean up dead trails
  for (let i = pastTrails.length - 1; i >= 0; i--) {
    if (!pastTrails[i].isAlive()) {
      pastTrails.splice(i, 1);
    }
  }

  if (laserActive || pastTrails.length > 0 || currentTrail) {
    ensureAnimation();
  } else {
    removeLaserOverlay();
  }
}

function createLaserOverlay() {
  if (svgContainer) return;

  svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgContainer.id = "laser-pointer-svg";
  svgContainer.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2147483647";

  const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  hitArea.setAttribute("x", "0");
  hitArea.setAttribute("y", "0");
  hitArea.setAttribute("width", "100%");
  hitArea.setAttribute("height", "100%");
  hitArea.setAttribute("fill", "transparent");
  hitArea.setAttribute("pointer-events", "all");
  svgContainer.appendChild(hitArea);

  pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElement.setAttribute("fill", LASER_COLOR);
  pathElement.setAttribute("stroke", "none");
  svgContainer.appendChild(pathElement);

  document.body.appendChild(svgContainer);
}

function updateOverlayInteractivity() {
  if (!svgContainer) return;
  svgContainer.style.pointerEvents = laserActive ? "auto" : "none";
}

function removeLaserOverlay() {
  if (svgContainer) {
    svgContainer.remove();
    svgContainer = null;
    pathElement = null;
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  currentTrail = null;
  pastTrails.length = 0;
}

function consumeLaserEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
}

function handlePointerMove(e) {
  if (!laserActive) return;
  consumeLaserEvent(e);

  if (
    !isDrawing ||
    !currentTrail ||
    activePointerId === null ||
    e.pointerId !== activePointerId
  ) {
    return;
  }

  currentTrail.addPointToPath(e.clientX, e.clientY);
}

function handlePointerDown(e) {
  if (!laserActive) return;
  consumeLaserEvent(e);
  if (e.button !== 0) return;
  if (activePointerId !== null) return;

  activePointerId = e.pointerId;
  isDrawing = true;
  currentTrail = new Trail();
  currentTrail.startPath(e.clientX, e.clientY);
  ensureAnimation();
}

function handlePointerUp(e) {
  if (!laserActive) return;
  consumeLaserEvent(e);
  if (activePointerId === null || e.pointerId !== activePointerId) return;

  activePointerId = null;
  if (!currentTrail) {
    isDrawing = false;
    return;
  }

  currentTrail.addPointToPath(e.clientX, e.clientY);
  currentTrail.endPath();
  pastTrails.push(currentTrail);
  currentTrail = null;
  isDrawing = false;
  ensureAnimation();
}

function handleClickBlock(e) {
  if (!laserActive) return;
  consumeLaserEvent(e);
}

function handleKeyDown(e) {
  if (!laserActive || e.key !== "Escape") return;
  consumeLaserEvent(e);
  setLaserMode(false);
}

function setLaserMode(enabled) {
  laserActive = enabled;
  if (enabled) {
    createLaserOverlay();
    updateOverlayInteractivity();
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerUp, true);
    window.addEventListener("click", handleClickBlock, true);
    window.addEventListener("auxclick", handleClickBlock, true);
    window.addEventListener("contextmenu", handleClickBlock, true);
    window.addEventListener("keydown", handleKeyDown, true);
    document.body.style.cursor = `url(${laserCursorSVG}) 0 0, crosshair`;
    ensureAnimation();
  } else {
    isDrawing = false;
    activePointerId = null;
    window.removeEventListener("pointermove", handlePointerMove, true);
    window.removeEventListener("pointerdown", handlePointerDown, true);
    window.removeEventListener("pointerup", handlePointerUp, true);
    window.removeEventListener("pointercancel", handlePointerUp, true);
    window.removeEventListener("click", handleClickBlock, true);
    window.removeEventListener("auxclick", handleClickBlock, true);
    window.removeEventListener("contextmenu", handleClickBlock, true);
    window.removeEventListener("keydown", handleKeyDown, true);
    document.body.style.cursor = "";
    updateOverlayInteractivity();
    if (currentTrail) {
      currentTrail.endPath();
      pastTrails.push(currentTrail);
      currentTrail = null;
    }
    if (pastTrails.length === 0) {
      removeLaserOverlay();
    } else {
      ensureAnimation();
    }
  }
}

function toggleLaser() {
  setLaserMode(!laserActive);
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggleLaser") {
    toggleLaser();
  }
});
