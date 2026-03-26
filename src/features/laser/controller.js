import { LASER_COLOR, laserCursorSVG } from "./config";
import { getSvgPathFromStroke } from "./path";
import { Trail } from "./trail";

export class LaserController {
  constructor() {
    this.laserActive = false;
    this.svgContainer = null;
    this.pathElement = null;
    this.animationFrame = null;
    this.laserColor = LASER_COLOR;

    this.isDrawing = false;
    this.activePointerId = null;
    this.currentTrail = null;
    this.pastTrails = [];

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleClickBlock = this.handleClickBlock.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleStorageChange = this.handleStorageChange.bind(this);
    this.tick = this.tick.bind(this);

    chrome.storage.local
      .get({ laserColor: LASER_COLOR })
      .then(({ laserColor }) => {
        this.updateLaserColor(laserColor);
      })
      .catch(() => {
        this.updateLaserColor(LASER_COLOR);
      });

    chrome.storage.onChanged.addListener(this.handleStorageChange);
  }

  toggle() {
    this.setEnabled(!this.laserActive);
  }

  setEnabled(enabled) {
    this.laserActive = enabled;

    if (enabled) {
      this.createLaserOverlay();
      this.updateOverlayInteractivity();
      this.addListeners();
      document.body.style.cursor = `url(${laserCursorSVG}) 0 0, crosshair`;
      this.ensureAnimation();
      return;
    }

    this.isDrawing = false;
    this.activePointerId = null;
    this.removeListeners();
    document.body.style.cursor = "";
    this.updateOverlayInteractivity();

    if (this.currentTrail) {
      this.currentTrail.endPath();
      this.pastTrails.push(this.currentTrail);
      this.currentTrail = null;
    }

    if (this.pastTrails.length === 0) {
      this.removeLaserOverlay();
    } else {
      this.ensureAnimation();
    }
  }

  ensureAnimation() {
    if (!this.animationFrame) {
      this.animationFrame = requestAnimationFrame(this.tick);
    }
  }

  tick() {
    this.animationFrame = null;
    this.renderAllTrails();

    for (let i = this.pastTrails.length - 1; i >= 0; i--) {
      if (!this.pastTrails[i].isAlive()) {
        this.pastTrails.splice(i, 1);
      }
    }

    if (this.laserActive || this.pastTrails.length > 0 || this.currentTrail) {
      this.ensureAnimation();
    } else {
      this.removeLaserOverlay();
    }
  }

  renderAllTrails() {
    if (!this.pathElement || !this.svgContainer) return;

    const paths = [];

    for (const trail of this.pastTrails) {
      const outline = trail.pointer.getStrokeOutline();
      const d = getSvgPathFromStroke(outline, true);
      if (d) paths.push(d);
    }

    if (this.currentTrail?.pointer) {
      const outline = this.currentTrail.pointer.getStrokeOutline();
      const d = getSvgPathFromStroke(outline, true);
      if (d) paths.push(d);
    }

    this.pathElement.setAttribute("d", paths.join(" ").trim());
  }

  createLaserOverlay() {
    if (this.svgContainer) return;

    this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svgContainer.id = "laser-pointer-svg";
    this.svgContainer.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2147483647";

    const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hitArea.setAttribute("x", "0");
    hitArea.setAttribute("y", "0");
    hitArea.setAttribute("width", "100%");
    hitArea.setAttribute("height", "100%");
    hitArea.setAttribute("fill", "transparent");
    hitArea.setAttribute("pointer-events", "all");
    this.svgContainer.appendChild(hitArea);

    this.pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.pathElement.setAttribute("fill", this.laserColor);
    this.pathElement.setAttribute("stroke", "none");
    this.svgContainer.appendChild(this.pathElement);

    document.body.appendChild(this.svgContainer);
  }

  updateLaserColor(nextColor) {
    if (typeof nextColor !== "string") return;
    this.laserColor = nextColor;
    if (this.pathElement) {
      this.pathElement.setAttribute("fill", this.laserColor);
    }
  }

  handleStorageChange(changes, areaName) {
    if (areaName !== "local") return;
    if (!changes.laserColor) return;
    this.updateLaserColor(changes.laserColor.newValue);
  }

  removeLaserOverlay() {
    if (this.svgContainer) {
      this.svgContainer.remove();
      this.svgContainer = null;
      this.pathElement = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.currentTrail = null;
    this.pastTrails.length = 0;
  }

  updateOverlayInteractivity() {
    if (!this.svgContainer) return;
    this.svgContainer.style.pointerEvents = this.laserActive ? "auto" : "none";
  }

  consumeLaserEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  handlePointerMove(event) {
    if (!this.laserActive) return;
    this.consumeLaserEvent(event);

    if (
      !this.isDrawing ||
      !this.currentTrail ||
      this.activePointerId === null ||
      event.pointerId !== this.activePointerId
    ) {
      return;
    }

    this.currentTrail.addPointToPath(event.clientX, event.clientY);
  }

  handlePointerDown(event) {
    if (!this.laserActive) return;
    this.consumeLaserEvent(event);
    if (event.button !== 0) return;
    if (this.activePointerId !== null) return;

    this.activePointerId = event.pointerId;
    this.isDrawing = true;
    this.currentTrail = new Trail();
    this.currentTrail.startPath(event.clientX, event.clientY);
    this.ensureAnimation();
  }

  handlePointerUp(event) {
    if (!this.laserActive) return;
    this.consumeLaserEvent(event);
    if (this.activePointerId === null || event.pointerId !== this.activePointerId) return;

    this.activePointerId = null;
    if (!this.currentTrail) {
      this.isDrawing = false;
      return;
    }

    this.currentTrail.addPointToPath(event.clientX, event.clientY);
    this.currentTrail.endPath();
    this.pastTrails.push(this.currentTrail);
    this.currentTrail = null;
    this.isDrawing = false;
    this.ensureAnimation();
  }

  handleClickBlock(event) {
    if (!this.laserActive) return;
    this.consumeLaserEvent(event);
  }

  handleKeyDown(event) {
    if (!this.laserActive || event.key !== "Escape") return;
    this.consumeLaserEvent(event);
    this.setEnabled(false);
  }

  addListeners() {
    window.addEventListener("pointermove", this.handlePointerMove, true);
    window.addEventListener("pointerdown", this.handlePointerDown, true);
    window.addEventListener("pointerup", this.handlePointerUp, true);
    window.addEventListener("pointercancel", this.handlePointerUp, true);
    window.addEventListener("click", this.handleClickBlock, true);
    window.addEventListener("auxclick", this.handleClickBlock, true);
    window.addEventListener("contextmenu", this.handleClickBlock, true);
    window.addEventListener("keydown", this.handleKeyDown, true);
  }

  removeListeners() {
    window.removeEventListener("pointermove", this.handlePointerMove, true);
    window.removeEventListener("pointerdown", this.handlePointerDown, true);
    window.removeEventListener("pointerup", this.handlePointerUp, true);
    window.removeEventListener("pointercancel", this.handlePointerUp, true);
    window.removeEventListener("click", this.handleClickBlock, true);
    window.removeEventListener("auxclick", this.handleClickBlock, true);
    window.removeEventListener("contextmenu", this.handleClickBlock, true);
    window.removeEventListener("keydown", this.handleKeyDown, true);
  }
}
