var content = (function() {
	//#region node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region node_modules/@wxt-dev/browser/src/index.mjs
	var browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = browser$1;
	//#endregion
	//#region src/features/laser/config.ts
	var DECAY_TIME = 1e3;
	var laserCursorSvg = `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 24 24" stroke-width="1" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path stroke="#1b1b1f" fill="#fff" d="m7.868 11.113 7.773 7.774a2.359 2.359 0 0 0 1.667.691 2.368 2.368 0 0 0 2.357-2.358c0-.625-.248-1.225-.69-1.667L11.201 7.78 9.558 9.469l-1.69 1.643v.001Zm10.273 3.606-3.333 3.333m-3.25-6.583 2 2m-7-7 3 3M3.664 3.625l1 1M2.529 6.922l1.407-.144m5.735-2.932-1.118.866M4.285 9.823l.758-1.194m1.863-6.207-.13 1.408"/></svg>`)}`;
	//#endregion
	//#region src/features/laser/math.ts
	var easeOut = (k) => 1 - Math.pow(1 - k, 4);
	var average = (a, b) => (a + b) / 2;
	var add = ([ax, ay, ar], [bx, by, br]) => [
		ax + bx,
		ay + by,
		ar + br
	];
	var sub = ([ax, ay, ar], [bx, by, br]) => [
		ax - bx,
		ay - by,
		ar - br
	];
	var smul = ([x, y, r], scalar) => [
		x * scalar,
		y * scalar,
		r * scalar
	];
	var norm = ([x, y, r]) => {
		const magnitude = Math.sqrt(x ** 2 + y ** 2);
		if (magnitude === 0) return [
			0,
			0,
			r
		];
		return [
			x / magnitude,
			y / magnitude,
			r
		];
	};
	var rot = ([x, y, r], rad) => [
		Math.cos(rad) * x - Math.sin(rad) * y,
		Math.sin(rad) * x + Math.cos(rad) * y,
		r
	];
	var plerp = (a, b, t) => add(a, smul(sub(b, a), t));
	var angle = (p, p1, p2) => Math.atan2(p2[1] - p[1], p2[0] - p[0]) - Math.atan2(p1[1] - p[1], p1[0] - p[0]);
	var normAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
	var mag = ([x, y]) => Math.sqrt(x ** 2 + y ** 2);
	var dist = ([ax, ay], [bx, by]) => Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
	var runLength = (points) => {
		if (points.length < 2) return 0;
		let length = 0;
		for (let index = 1; index <= points.length - 1; index += 1) length += dist(points[index - 1], points[index]);
		length += dist(points[points.length - 2], points[points.length - 1]);
		return length;
	};
	//#endregion
	//#region src/features/laser/path.ts
	function getSvgPathFromStroke(points, closed = true) {
		const length = points.length;
		if (length < 4) return "";
		let pointA = points[0];
		let pointB = points[1];
		const pointC = points[2];
		let result = `M${pointA[0].toFixed(2)},${pointA[1].toFixed(2)} Q${pointB[0].toFixed(2)},${pointB[1].toFixed(2)} ${average(pointB[0], pointC[0]).toFixed(2)},${average(pointB[1], pointC[1]).toFixed(2)} T`;
		for (let index = 2, max = length - 1; index < max; index += 1) {
			pointA = points[index];
			pointB = points[index + 1];
			result += `${average(pointA[0], pointB[0]).toFixed(2)},${average(pointA[1], pointB[1]).toFixed(2)} `;
		}
		if (closed) result += "Z";
		return result;
	}
	//#endregion
	//#region src/features/laser/pointer.ts
	var LaserPointer = class LaserPointer {
		static defaults = {
			size: 2,
			streamline: .45,
			simplify: 0,
			keepHead: false,
			sizeMapping: () => 1
		};
		static constants = {
			cornerDetectionMaxAngle: 75,
			cornerDetectionVariance: (speed) => speed > 35 ? .5 : 1,
			maxTailLength: 50
		};
		options;
		originalPoints = [];
		stablePoints = [];
		tailPoints = [];
		isFresh = true;
		isClosed = false;
		constructor(options = {}) {
			this.options = {
				...LaserPointer.defaults,
				...options
			};
		}
		get lastPoint() {
			return this.tailPoints[this.tailPoints.length - 1] ?? this.stablePoints[this.stablePoints.length - 1];
		}
		addPoint(point) {
			const lastPoint = this.originalPoints[this.originalPoints.length - 1];
			if (lastPoint && lastPoint[0] === point[0] && lastPoint[1] === point[1]) return;
			this.originalPoints.push(point);
			if (this.isFresh) {
				this.isFresh = false;
				this.stablePoints.push(point);
				return;
			}
			let nextPoint = point;
			if (this.options.streamline > 0) nextPoint = plerp(this.lastPoint, nextPoint, 1 - this.options.streamline);
			this.tailPoints.push(nextPoint);
			if (runLength(this.tailPoints) > LaserPointer.constants.maxTailLength) this.stabilizeTail();
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
			return (sizeOverride ?? this.options.size) * this.options.sizeMapping({
				pressure,
				runningLength,
				currentIndex: index,
				totalLength
			});
		}
		getStrokeOutline(sizeOverride) {
			if (this.isFresh) return [];
			const points = [...this.stablePoints, ...this.tailPoints];
			const length = points.length;
			if (length === 0) return [];
			if (length === 1) {
				const center = points[0];
				const size = this.getSize(sizeOverride, center[2], 0, length, 0);
				if (size < .5) return [];
				const contour = [];
				for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) contour.push(add(center, smul(rot([
					1,
					0,
					0
				], theta), size)));
				contour.push(add(center, smul([
					1,
					0,
					0
				], size)));
				return contour;
			}
			if (length === 2) {
				const current = points[0];
				const next = points[1];
				const currentSize = this.getSize(sizeOverride, current[2], 0, length, 0);
				const nextSize = this.getSize(sizeOverride, next[2], 0, length, 0);
				if (currentSize < .5 || nextSize < .5) return [];
				const contour = [];
				const pointerAngle = angle(current, [
					current[0],
					current[1] - 100,
					current[2]
				], next);
				for (let theta = pointerAngle; theta <= Math.PI + pointerAngle; theta += Math.PI / 16) contour.push(add(current, smul(rot([
					1,
					0,
					0
				], theta), currentSize)));
				for (let theta = Math.PI + pointerAngle; theta <= Math.PI * 2 + pointerAngle; theta += Math.PI / 16) contour.push(add(next, smul(rot([
					1,
					0,
					0
				], theta), nextSize)));
				contour.push(contour[0]);
				return contour;
			}
			const forwardPoints = [];
			const backwardPoints = [];
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
				speed = previousSpeed + (distance - previousSpeed) * .2;
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
				const thresholdAngle = LaserPointer.constants.cornerDetectionMaxAngle / 180 * Math.PI * LaserPointer.constants.cornerDetectionVariance(speed);
				if (Math.abs(currentAngle) < thresholdAngle) {
					const turnAngle = Math.abs(normAngle(Math.PI - currentAngle));
					if (turnAngle === 0) continue;
					if (currentAngle < 0) {
						backwardPoints.push(add(current, smul(perp2PrevCurrent, currentSize)), pointBackward);
						for (let theta = 0; theta <= turnAngle; theta += turnAngle / 4) forwardPoints.push(add(current, rot(smul(perp1PrevCurrent, currentSize), theta)));
						for (let theta = turnAngle; theta >= 0; theta -= turnAngle / 4) backwardPoints.push(add(current, rot(smul(perp1PrevCurrent, currentSize), theta)));
						backwardPoints.push(pointBackward, add(current, smul(perp1NextCurrent, currentSize)));
					} else {
						forwardPoints.push(add(current, smul(perp1PrevCurrent, currentSize)), pointForward);
						for (let theta = 0; theta <= turnAngle; theta += turnAngle / 4) backwardPoints.push(add(current, rot(smul(perp1PrevCurrent, -currentSize), -theta)));
						for (let theta = turnAngle; theta >= 0; theta -= turnAngle / 4) forwardPoints.push(add(current, rot(smul(perp1PrevCurrent, -currentSize), -theta)));
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
					const contour = [];
					for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) contour.push(add(center, smul(rot([
						1,
						0,
						0
					], theta), this.options.size)));
					contour.push(add(center, smul([
						1,
						0,
						0
					], this.options.size)));
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
			const endCapSize = this.options.keepHead ? this.options.size : this.getSize(sizeOverride, penultimate[2], length - 2, length, runningLength);
			const startCap = [];
			const endCap = [];
			if (startCapSize > .1) {
				for (let theta = 0; theta <= Math.PI; theta += Math.PI / 16) startCap.unshift(add(first, rot(smul(perpFirstSecond, startCapSize), -theta)));
				startCap.unshift(add(first, smul(perpFirstSecond, -startCapSize)));
			} else startCap.push(first);
			for (let theta = 0; theta <= Math.PI * 3; theta += Math.PI / 16) endCap.push(add(ultimate, rot(smul(perpPenultimateUltimate, -endCapSize), -theta)));
			const strokeOutline = [
				...startCap,
				...forwardPoints,
				...endCap.reverse(),
				...backwardPoints.reverse()
			];
			if (startCap.length > 0) strokeOutline.push(startCap[0]);
			return strokeOutline;
		}
	};
	//#endregion
	//#region src/features/laser/trail.ts
	var Trail = class {
		pointer = null;
		startPath(x, y) {
			this.pointer = new LaserPointer({
				simplify: 0,
				streamline: .4,
				sizeMapping: (context) => {
					const timeFactor = Math.max(0, 1 - (performance.now() - context.pressure) / DECAY_TIME);
					const lengthFactor = (50 - Math.min(50, context.totalLength - context.currentIndex)) / 50;
					return Math.min(easeOut(lengthFactor), easeOut(timeFactor));
				}
			});
			this.pointer.addPoint([
				x,
				y,
				performance.now()
			]);
		}
		addPointToPath(x, y) {
			if (!this.pointer) return;
			this.pointer.addPoint([
				x,
				y,
				performance.now()
			]);
		}
		endPath() {
			this.pointer?.close();
		}
		isAlive() {
			if (!this.pointer) return false;
			return this.pointer.getStrokeOutline().length > 0;
		}
	};
	//#endregion
	//#region src/features/laser/controller.ts
	var LaserController = class {
		laserActive = false;
		svgContainer = null;
		pathElement = null;
		animationFrame = null;
		laserColor;
		isDrawing = false;
		activePointerId = null;
		currentTrail = null;
		pastTrails = [];
		constructor(initialColor) {
			this.laserColor = initialColor;
			this.handlePointerMove = this.handlePointerMove.bind(this);
			this.handlePointerDown = this.handlePointerDown.bind(this);
			this.handlePointerUp = this.handlePointerUp.bind(this);
			this.handleClickBlock = this.handleClickBlock.bind(this);
			this.handleKeyDown = this.handleKeyDown.bind(this);
			this.tick = this.tick.bind(this);
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
				document.body.style.cursor = `url(${laserCursorSvg}) 0 0, crosshair`;
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
			if (this.pastTrails.length === 0) this.removeLaserOverlay();
			else this.ensureAnimation();
		}
		setLaserColor(nextColor) {
			if (typeof nextColor !== "string") return;
			this.laserColor = nextColor;
			this.pathElement?.setAttribute("fill", this.laserColor);
		}
		ensureAnimation() {
			if (this.animationFrame) return;
			this.animationFrame = requestAnimationFrame(this.tick);
		}
		tick() {
			this.animationFrame = null;
			this.renderAllTrails();
			for (let index = this.pastTrails.length - 1; index >= 0; index -= 1) if (!this.pastTrails[index].isAlive()) this.pastTrails.splice(index, 1);
			if (this.laserActive || this.pastTrails.length > 0 || this.currentTrail) this.ensureAnimation();
			else this.removeLaserOverlay();
		}
		renderAllTrails() {
			if (!this.pathElement || !this.svgContainer) return;
			const paths = [];
			for (const trail of this.pastTrails) {
				const outline = trail.pointer?.getStrokeOutline();
				if (!outline) continue;
				const d = getSvgPathFromStroke(outline, true);
				if (d) paths.push(d);
			}
			if (this.currentTrail?.pointer) {
				const d = getSvgPathFromStroke(this.currentTrail.pointer.getStrokeOutline(), true);
				if (d) paths.push(d);
			}
			this.pathElement.setAttribute("d", paths.join(" ").trim());
		}
		createLaserOverlay() {
			if (this.svgContainer) return;
			this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			this.svgContainer.id = "laser-pointer-svg";
			this.svgContainer.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2147483647";
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
		removeLaserOverlay() {
			this.svgContainer?.remove();
			this.svgContainer = null;
			this.pathElement = null;
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
			if (!this.isDrawing || !this.currentTrail || this.activePointerId === null || event.pointerId !== this.activePointerId) return;
			this.currentTrail.addPointToPath(event.clientX, event.clientY);
		}
		handlePointerDown(event) {
			if (!this.laserActive) return;
			this.consumeLaserEvent(event);
			if (event.button !== 0 || this.activePointerId !== null) return;
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
	};
	//#endregion
	//#region src/features/pen/controller.ts
	var PenController = class {
		penActive = false;
		svgContainer = null;
		pathElement = null;
		isDrawing = false;
		penColor;
		penWidth;
		constructor(initialColor = "#3b82f6", initialWidth = 3) {
			this.penColor = initialColor;
			this.penWidth = initialWidth;
			this.handlePointerMove = this.handlePointerMove.bind(this);
			this.handlePointerDown = this.handlePointerDown.bind(this);
			this.handlePointerUp = this.handlePointerUp.bind(this);
			this.handleKeyDown = this.handleKeyDown.bind(this);
		}
		toggle() {
			this.setEnabled(!this.penActive);
		}
		setEnabled(enabled) {
			this.penActive = enabled;
			if (enabled) {
				this.createPenOverlay();
				document.body.style.cursor = "crosshair";
				this.addListeners();
				return;
			}
			this.isDrawing = false;
			this.removeListeners();
			document.body.style.cursor = "";
			this.removePenOverlay();
		}
		setPenColor(nextColor) {
			if (typeof nextColor !== "string") return;
			this.penColor = nextColor;
			if (this.pathElement) this.pathElement.setAttribute("stroke", this.penColor);
		}
		setColor(nextColor) {
			this.setPenColor(nextColor);
		}
		setPenWidth(nextWidth) {
			if (typeof nextWidth !== "number" || nextWidth <= 0) return;
			this.penWidth = nextWidth;
			if (this.pathElement) this.pathElement.setAttribute("stroke-width", String(this.penWidth));
		}
		setWidth(nextWidth) {
			this.setPenWidth(nextWidth);
		}
		createPenOverlay() {
			if (this.svgContainer) return;
			this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			this.svgContainer.id = "pen-overlay-svg";
			this.svgContainer.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2147483647";
			const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			hitArea.setAttribute("x", "0");
			hitArea.setAttribute("y", "0");
			hitArea.setAttribute("width", "100%");
			hitArea.setAttribute("height", "100%");
			hitArea.setAttribute("fill", "transparent");
			hitArea.setAttribute("pointer-events", "all");
			this.svgContainer.appendChild(hitArea);
			document.body.appendChild(this.svgContainer);
		}
		removePenOverlay() {
			this.svgContainer?.remove();
			this.svgContainer = null;
			this.pathElement = null;
		}
		handlePointerMove(event) {
			if (!this.penActive || !this.isDrawing || !this.pathElement) return;
			const x = event.clientX;
			const y = event.clientY;
			const d = this.pathElement.getAttribute("d") || "";
			this.pathElement.setAttribute("d", `${d} L${x},${y}`);
		}
		handlePointerDown(event) {
			if (!this.penActive || event.button !== 0) return;
			this.isDrawing = true;
			this.pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
			this.pathElement.setAttribute("d", `M${event.clientX},${event.clientY}`);
			this.pathElement.setAttribute("stroke", this.penColor);
			this.pathElement.setAttribute("stroke-width", String(this.penWidth));
			this.pathElement.setAttribute("fill", "none");
			this.pathElement.setAttribute("stroke-linecap", "round");
			this.pathElement.setAttribute("stroke-linejoin", "round");
			this.svgContainer?.appendChild(this.pathElement);
		}
		handlePointerUp() {
			this.isDrawing = false;
			this.pathElement = null;
		}
		handleKeyDown(event) {
			if (!this.penActive || event.key !== "Escape") return;
			this.setEnabled(false);
		}
		addListeners() {
			window.addEventListener("pointermove", this.handlePointerMove, true);
			window.addEventListener("pointerdown", this.handlePointerDown, true);
			window.addEventListener("pointerup", this.handlePointerUp, true);
			window.addEventListener("pointercancel", this.handlePointerUp, true);
			window.addEventListener("keydown", this.handleKeyDown, true);
		}
		removeListeners() {
			window.removeEventListener("pointermove", this.handlePointerMove, true);
			window.removeEventListener("pointerdown", this.handlePointerDown, true);
			window.removeEventListener("pointerup", this.handlePointerUp, true);
			window.removeEventListener("pointercancel", this.handlePointerUp, true);
			window.removeEventListener("keydown", this.handleKeyDown, true);
		}
	};
	//#endregion
	//#region src/features/shapes/controller.ts
	var ShapesController = class {
		shapesActive = false;
		svgContainer = null;
		currentShape = null;
		isDrawing = false;
		startX = 0;
		startY = 0;
		shapeColor;
		shapeType = "rect";
		constructor(initialColor = "#f97316") {
			this.shapeColor = initialColor;
			this.handlePointerMove = this.handlePointerMove.bind(this);
			this.handlePointerDown = this.handlePointerDown.bind(this);
			this.handlePointerUp = this.handlePointerUp.bind(this);
			this.handleKeyDown = this.handleKeyDown.bind(this);
		}
		toggle() {
			this.setEnabled(!this.shapesActive);
		}
		setEnabled(enabled) {
			this.shapesActive = enabled;
			if (enabled) {
				this.createShapesOverlay();
				document.body.style.cursor = "crosshair";
				this.addListeners();
				return;
			}
			this.isDrawing = false;
			this.removeListeners();
			document.body.style.cursor = "";
			this.removeShapesOverlay();
		}
		setShapeColor(nextColor) {
			if (typeof nextColor !== "string") return;
			this.shapeColor = nextColor;
		}
		setShapeType(shapeType) {
			this.shapeType = shapeType;
		}
		createShapesOverlay() {
			if (this.svgContainer) return;
			this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			this.svgContainer.id = "shapes-overlay-svg";
			this.svgContainer.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2147483647";
			const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			hitArea.setAttribute("x", "0");
			hitArea.setAttribute("y", "0");
			hitArea.setAttribute("width", "100%");
			hitArea.setAttribute("height", "100%");
			hitArea.setAttribute("fill", "transparent");
			hitArea.setAttribute("pointer-events", "all");
			this.svgContainer.appendChild(hitArea);
			document.body.appendChild(this.svgContainer);
		}
		removeShapesOverlay() {
			this.svgContainer?.remove();
			this.svgContainer = null;
			this.currentShape = null;
		}
		handlePointerMove(event) {
			if (!this.shapesActive || !this.isDrawing || !this.currentShape) return;
			const currentX = event.clientX;
			const currentY = event.clientY;
			const width = currentX - this.startX;
			const height = currentY - this.startY;
			if (this.shapeType === "rect") {
				this.currentShape.setAttribute("x", String(this.startX));
				this.currentShape.setAttribute("y", String(this.startY));
				this.currentShape.setAttribute("width", String(Math.abs(width)));
				this.currentShape.setAttribute("height", String(Math.abs(height)));
			} else if (this.shapeType === "circle") {
				const radius = Math.sqrt(width ** 2 + height ** 2) / 2;
				this.currentShape.setAttribute("r", String(radius));
				this.currentShape.setAttribute("cx", String(this.startX + width / 2));
				this.currentShape.setAttribute("cy", String(this.startY + height / 2));
			} else if (this.shapeType === "line") {
				this.currentShape.setAttribute("x2", String(currentX));
				this.currentShape.setAttribute("y2", String(currentY));
			}
		}
		handlePointerDown(event) {
			if (!this.shapesActive || event.button !== 0) return;
			this.isDrawing = true;
			this.startX = event.clientX;
			this.startY = event.clientY;
			if (this.shapeType === "rect") {
				this.currentShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
				this.currentShape.setAttribute("x", String(this.startX));
				this.currentShape.setAttribute("y", String(this.startY));
				this.currentShape.setAttribute("width", "0");
				this.currentShape.setAttribute("height", "0");
			} else if (this.shapeType === "circle") {
				this.currentShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
				this.currentShape.setAttribute("cx", String(this.startX));
				this.currentShape.setAttribute("cy", String(this.startY));
				this.currentShape.setAttribute("r", "0");
			} else if (this.shapeType === "line") {
				this.currentShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
				this.currentShape.setAttribute("x1", String(this.startX));
				this.currentShape.setAttribute("y1", String(this.startY));
				this.currentShape.setAttribute("x2", String(this.startX));
				this.currentShape.setAttribute("y2", String(this.startY));
			}
			this.currentShape?.setAttribute("stroke", this.shapeColor);
			this.currentShape?.setAttribute("stroke-width", "2");
			this.currentShape?.setAttribute("fill", "none");
			if (this.currentShape) this.svgContainer?.appendChild(this.currentShape);
		}
		handlePointerUp() {
			this.isDrawing = false;
			this.currentShape = null;
		}
		handleKeyDown(event) {
			if (!this.shapesActive || event.key !== "Escape") return;
			this.setEnabled(false);
		}
		addListeners() {
			window.addEventListener("pointermove", this.handlePointerMove, true);
			window.addEventListener("pointerdown", this.handlePointerDown, true);
			window.addEventListener("pointerup", this.handlePointerUp, true);
			window.addEventListener("pointercancel", this.handlePointerUp, true);
			window.addEventListener("keydown", this.handleKeyDown, true);
		}
		removeListeners() {
			window.removeEventListener("pointermove", this.handlePointerMove, true);
			window.removeEventListener("pointerdown", this.handlePointerDown, true);
			window.removeEventListener("pointerup", this.handlePointerUp, true);
			window.removeEventListener("pointercancel", this.handlePointerUp, true);
			window.removeEventListener("keydown", this.handleKeyDown, true);
		}
	};
	//#endregion
	//#region src/features/stickers/controller.ts
	var STICKER_PACK = [
		"😂",
		"❤️",
		"👍",
		"🔥",
		"⭐",
		"🎉",
		"😍",
		"🚀",
		"💯",
		"😎",
		"🤔",
		"😭"
	];
	var StickersController = class {
		stickersActive = false;
		containerElement = null;
		currentSticker = "😂";
		constructor(initialSticker = "😂") {
			this.currentSticker = initialSticker;
			this.handleClick = this.handleClick.bind(this);
			this.handleKeyDown = this.handleKeyDown.bind(this);
		}
		toggle() {
			this.setEnabled(!this.stickersActive);
		}
		setEnabled(enabled) {
			this.stickersActive = enabled;
			if (enabled) {
				this.createStickersOverlay();
				document.body.style.cursor = "url(\"data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Ctext y=%2220%22 font-size=%2220%22%3E" + encodeURIComponent(this.currentSticker) + "%3C/text%3E%3C/svg%3E\") 0 0, auto";
				this.addListeners();
				return;
			}
			this.removeListeners();
			document.body.style.cursor = "";
			this.removeStickersOverlay();
		}
		setCurrentSticker(sticker) {
			if (typeof sticker !== "string" || !STICKER_PACK.includes(sticker)) return;
			this.currentSticker = sticker;
		}
		createStickersOverlay() {
			if (this.containerElement) return;
			this.containerElement = document.createElement("div");
			this.containerElement.id = "stickers-overlay";
			this.containerElement.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646";
			document.body.appendChild(this.containerElement);
		}
		removeStickersOverlay() {
			document.querySelectorAll(".visboard-sticker").forEach((s) => s.remove());
			this.containerElement?.remove();
			this.containerElement = null;
		}
		handleClick(event) {
			if (!this.stickersActive) return;
			const stickerEl = document.createElement("div");
			stickerEl.classList.add("visboard-sticker");
			stickerEl.textContent = this.currentSticker;
			stickerEl.style.cssText = `position:fixed;left:${event.clientX}px;top:${event.clientY}px;font-size:32px;pointer-events:none;user-select:none;z-index:2147483647;animation:fadeInScale 0.3s ease-out;`;
			if (!document.getElementById("stickers-animation-style")) {
				const style = document.createElement("style");
				style.id = "stickers-animation-style";
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
			setTimeout(() => {
				stickerEl.style.animation = "fadeInScale 0.3s ease-in reverse";
				setTimeout(() => stickerEl.remove(), 300);
			}, 3e3);
		}
		handleKeyDown(event) {
			if (!this.stickersActive || event.key !== "Escape") return;
			this.setEnabled(false);
		}
		addListeners() {
			window.addEventListener("click", this.handleClick, true);
			window.addEventListener("keydown", this.handleKeyDown, true);
		}
		removeListeners() {
			window.removeEventListener("click", this.handleClick, true);
			window.removeEventListener("keydown", this.handleKeyDown, true);
		}
	};
	//#endregion
	//#region src/features/tools/tool-manager.ts
	var ToolManager = class {
		tools = /* @__PURE__ */ new Map();
		register(name, tool) {
			this.tools.set(name, tool);
		}
		get(name) {
			return this.tools.get(name) ?? null;
		}
		toggle(name) {
			const tool = this.get(name);
			if (!tool) return;
			tool.toggle();
		}
		setEnabled(name, enabled) {
			const tool = this.get(name);
			if (!tool) return;
			tool.setEnabled(enabled);
		}
	};
	//#endregion
	//#region src/shared/messages.ts
	var VISBOARD_MESSAGES = {
		TOGGLE_ACTIVE: "visboard:toggle-active",
		SET_ACTIVE: "visboard:set-active",
		SET_TOOL: "visboard:set-tool",
		SETTINGS_UPDATED: "visboard:settings-updated"
	};
	//#endregion
	//#region node_modules/async-mutex/index.mjs
	var E_CANCELED = /* @__PURE__ */ new Error("request for lock canceled");
	var __awaiter$2 = function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var Semaphore = class {
		constructor(_value, _cancelError = E_CANCELED) {
			this._value = _value;
			this._cancelError = _cancelError;
			this._queue = [];
			this._weightedWaiters = [];
		}
		acquire(weight = 1, priority = 0) {
			if (weight <= 0) throw new Error(`invalid weight ${weight}: must be positive`);
			return new Promise((resolve, reject) => {
				const task = {
					resolve,
					reject,
					weight,
					priority
				};
				const i = findIndexFromEnd(this._queue, (other) => priority <= other.priority);
				if (i === -1 && weight <= this._value) this._dispatchItem(task);
				else this._queue.splice(i + 1, 0, task);
			});
		}
		runExclusive(callback_1) {
			return __awaiter$2(this, arguments, void 0, function* (callback, weight = 1, priority = 0) {
				const [value, release] = yield this.acquire(weight, priority);
				try {
					return yield callback(value);
				} finally {
					release();
				}
			});
		}
		waitForUnlock(weight = 1, priority = 0) {
			if (weight <= 0) throw new Error(`invalid weight ${weight}: must be positive`);
			if (this._couldLockImmediately(weight, priority)) return Promise.resolve();
			else return new Promise((resolve) => {
				if (!this._weightedWaiters[weight - 1]) this._weightedWaiters[weight - 1] = [];
				insertSorted(this._weightedWaiters[weight - 1], {
					resolve,
					priority
				});
			});
		}
		isLocked() {
			return this._value <= 0;
		}
		getValue() {
			return this._value;
		}
		setValue(value) {
			this._value = value;
			this._dispatchQueue();
		}
		release(weight = 1) {
			if (weight <= 0) throw new Error(`invalid weight ${weight}: must be positive`);
			this._value += weight;
			this._dispatchQueue();
		}
		cancel() {
			this._queue.forEach((entry) => entry.reject(this._cancelError));
			this._queue = [];
		}
		_dispatchQueue() {
			this._drainUnlockWaiters();
			while (this._queue.length > 0 && this._queue[0].weight <= this._value) {
				this._dispatchItem(this._queue.shift());
				this._drainUnlockWaiters();
			}
		}
		_dispatchItem(item) {
			const previousValue = this._value;
			this._value -= item.weight;
			item.resolve([previousValue, this._newReleaser(item.weight)]);
		}
		_newReleaser(weight) {
			let called = false;
			return () => {
				if (called) return;
				called = true;
				this.release(weight);
			};
		}
		_drainUnlockWaiters() {
			if (this._queue.length === 0) for (let weight = this._value; weight > 0; weight--) {
				const waiters = this._weightedWaiters[weight - 1];
				if (!waiters) continue;
				waiters.forEach((waiter) => waiter.resolve());
				this._weightedWaiters[weight - 1] = [];
			}
			else {
				const queuedPriority = this._queue[0].priority;
				for (let weight = this._value; weight > 0; weight--) {
					const waiters = this._weightedWaiters[weight - 1];
					if (!waiters) continue;
					const i = waiters.findIndex((waiter) => waiter.priority <= queuedPriority);
					(i === -1 ? waiters : waiters.splice(0, i)).forEach(((waiter) => waiter.resolve()));
				}
			}
		}
		_couldLockImmediately(weight, priority) {
			return (this._queue.length === 0 || this._queue[0].priority < priority) && weight <= this._value;
		}
	};
	function insertSorted(a, v) {
		const i = findIndexFromEnd(a, (other) => v.priority <= other.priority);
		a.splice(i + 1, 0, v);
	}
	function findIndexFromEnd(a, predicate) {
		for (let i = a.length - 1; i >= 0; i--) if (predicate(a[i])) return i;
		return -1;
	}
	var __awaiter$1 = function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var Mutex = class {
		constructor(cancelError) {
			this._semaphore = new Semaphore(1, cancelError);
		}
		acquire() {
			return __awaiter$1(this, arguments, void 0, function* (priority = 0) {
				const [, releaser] = yield this._semaphore.acquire(1, priority);
				return releaser;
			});
		}
		runExclusive(callback, priority = 0) {
			return this._semaphore.runExclusive(() => callback(), 1, priority);
		}
		isLocked() {
			return this._semaphore.isLocked();
		}
		waitForUnlock(priority = 0) {
			return this._semaphore.waitForUnlock(1, priority);
		}
		release() {
			if (this._semaphore.isLocked()) this._semaphore.release();
		}
		cancel() {
			return this._semaphore.cancel();
		}
	};
	//#endregion
	//#region node_modules/dequal/lite/index.mjs
	var has = Object.prototype.hasOwnProperty;
	function dequal(foo, bar) {
		var ctor, len;
		if (foo === bar) return true;
		if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
			if (ctor === Date) return foo.getTime() === bar.getTime();
			if (ctor === RegExp) return foo.toString() === bar.toString();
			if (ctor === Array) {
				if ((len = foo.length) === bar.length) while (len-- && dequal(foo[len], bar[len]));
				return len === -1;
			}
			if (!ctor || typeof foo === "object") {
				len = 0;
				for (ctor in foo) {
					if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
					if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
				}
				return Object.keys(bar).length === len;
			}
		}
		return foo !== foo && bar !== bar;
	}
	//#endregion
	//#region node_modules/@wxt-dev/storage/dist/index.mjs
	/**
	* Simplified storage APIs with support for versioned fields, snapshots, metadata, and item definitions.
	*
	* See [the guide](https://wxt.dev/storage.html) for more information.
	* @module @wxt-dev/storage
	*/
	var storage = createStorage();
	function createStorage() {
		const drivers = {
			local: createDriver("local"),
			session: createDriver("session"),
			sync: createDriver("sync"),
			managed: createDriver("managed")
		};
		const getDriver = (area) => {
			const driver = drivers[area];
			if (driver == null) {
				const areaNames = Object.keys(drivers).join(", ");
				throw Error(`Invalid area "${area}". Options: ${areaNames}`);
			}
			return driver;
		};
		const resolveKey = (key) => {
			const deliminatorIndex = key.indexOf(":");
			const driverArea = key.substring(0, deliminatorIndex);
			const driverKey = key.substring(deliminatorIndex + 1);
			if (driverKey == null) throw Error(`Storage key should be in the form of "area:key", but received "${key}"`);
			return {
				driverArea,
				driverKey,
				driver: getDriver(driverArea)
			};
		};
		const getMetaKey = (key) => key + "$";
		const mergeMeta = (oldMeta, newMeta) => {
			const newFields = { ...oldMeta };
			Object.entries(newMeta).forEach(([key, value]) => {
				if (value == null) delete newFields[key];
				else newFields[key] = value;
			});
			return newFields;
		};
		const getValueOrFallback = (value, fallback) => value ?? fallback ?? null;
		const getMetaValue = (properties) => typeof properties === "object" && !Array.isArray(properties) ? properties : {};
		const getItem = async (driver, driverKey, opts) => {
			return getValueOrFallback(await driver.getItem(driverKey), opts?.fallback ?? opts?.defaultValue);
		};
		const getMeta = async (driver, driverKey) => {
			const metaKey = getMetaKey(driverKey);
			return getMetaValue(await driver.getItem(metaKey));
		};
		const setItem = async (driver, driverKey, value) => {
			await driver.setItem(driverKey, value ?? null);
		};
		const setMeta = async (driver, driverKey, properties) => {
			const metaKey = getMetaKey(driverKey);
			const existingFields = getMetaValue(await driver.getItem(metaKey));
			await driver.setItem(metaKey, mergeMeta(existingFields, properties));
		};
		const removeItem = async (driver, driverKey, opts) => {
			await driver.removeItem(driverKey);
			if (opts?.removeMeta) {
				const metaKey = getMetaKey(driverKey);
				await driver.removeItem(metaKey);
			}
		};
		const removeMeta = async (driver, driverKey, properties) => {
			const metaKey = getMetaKey(driverKey);
			if (properties == null) await driver.removeItem(metaKey);
			else {
				const newFields = getMetaValue(await driver.getItem(metaKey));
				[properties].flat().forEach((field) => delete newFields[field]);
				await driver.setItem(metaKey, newFields);
			}
		};
		const watch = (driver, driverKey, cb) => driver.watch(driverKey, cb);
		return {
			getItem: async (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				return await getItem(driver, driverKey, opts);
			},
			getItems: async (keys) => {
				const areaToKeyMap = /* @__PURE__ */ new Map();
				const keyToOptsMap = /* @__PURE__ */ new Map();
				const orderedKeys = [];
				keys.forEach((key) => {
					let keyStr;
					let opts;
					if (typeof key === "string") keyStr = key;
					else if ("getValue" in key) {
						keyStr = key.key;
						opts = { fallback: key.fallback };
					} else {
						keyStr = key.key;
						opts = key.options;
					}
					orderedKeys.push(keyStr);
					const { driverArea, driverKey } = resolveKey(keyStr);
					const areaKeys = areaToKeyMap.get(driverArea) ?? [];
					areaToKeyMap.set(driverArea, areaKeys.concat(driverKey));
					keyToOptsMap.set(keyStr, opts);
				});
				const resultsMap = /* @__PURE__ */ new Map();
				await Promise.all(Array.from(areaToKeyMap.entries()).map(async ([driverArea, keys]) => {
					(await drivers[driverArea].getItems(keys)).forEach((driverResult) => {
						const key = `${driverArea}:${driverResult.key}`;
						const opts = keyToOptsMap.get(key);
						const value = getValueOrFallback(driverResult.value, opts?.fallback ?? opts?.defaultValue);
						resultsMap.set(key, value);
					});
				}));
				return orderedKeys.map((key) => ({
					key,
					value: resultsMap.get(key)
				}));
			},
			getMeta: async (key) => {
				const { driver, driverKey } = resolveKey(key);
				return await getMeta(driver, driverKey);
			},
			getMetas: async (args) => {
				const keys = args.map((arg) => {
					const key = typeof arg === "string" ? arg : arg.key;
					const { driverArea, driverKey } = resolveKey(key);
					return {
						key,
						driverArea,
						driverKey,
						driverMetaKey: getMetaKey(driverKey)
					};
				});
				const areaToDriverMetaKeysMap = keys.reduce((map, key) => {
					map[key.driverArea] ??= [];
					map[key.driverArea].push(key);
					return map;
				}, {});
				const resultsMap = {};
				await Promise.all(Object.entries(areaToDriverMetaKeysMap).map(async ([area, keys]) => {
					const areaRes = await browser$1.storage[area].get(keys.map((key) => key.driverMetaKey));
					keys.forEach((key) => {
						resultsMap[key.key] = areaRes[key.driverMetaKey] ?? {};
					});
				}));
				return keys.map((key) => ({
					key: key.key,
					meta: resultsMap[key.key]
				}));
			},
			setItem: async (key, value) => {
				const { driver, driverKey } = resolveKey(key);
				await setItem(driver, driverKey, value);
			},
			setItems: async (items) => {
				const areaToKeyValueMap = {};
				items.forEach((item) => {
					const { driverArea, driverKey } = resolveKey("key" in item ? item.key : item.item.key);
					areaToKeyValueMap[driverArea] ??= [];
					areaToKeyValueMap[driverArea].push({
						key: driverKey,
						value: item.value
					});
				});
				await Promise.all(Object.entries(areaToKeyValueMap).map(async ([driverArea, values]) => {
					await getDriver(driverArea).setItems(values);
				}));
			},
			setMeta: async (key, properties) => {
				const { driver, driverKey } = resolveKey(key);
				await setMeta(driver, driverKey, properties);
			},
			setMetas: async (items) => {
				const areaToMetaUpdatesMap = {};
				items.forEach((item) => {
					const { driverArea, driverKey } = resolveKey("key" in item ? item.key : item.item.key);
					areaToMetaUpdatesMap[driverArea] ??= [];
					areaToMetaUpdatesMap[driverArea].push({
						key: driverKey,
						properties: item.meta
					});
				});
				await Promise.all(Object.entries(areaToMetaUpdatesMap).map(async ([storageArea, updates]) => {
					const driver = getDriver(storageArea);
					const metaKeys = updates.map(({ key }) => getMetaKey(key));
					const existingMetas = await driver.getItems(metaKeys);
					const existingMetaMap = Object.fromEntries(existingMetas.map(({ key, value }) => [key, getMetaValue(value)]));
					const metaUpdates = updates.map(({ key, properties }) => {
						const metaKey = getMetaKey(key);
						return {
							key: metaKey,
							value: mergeMeta(existingMetaMap[metaKey] ?? {}, properties)
						};
					});
					await driver.setItems(metaUpdates);
				}));
			},
			removeItem: async (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				await removeItem(driver, driverKey, opts);
			},
			removeItems: async (keys) => {
				const areaToKeysMap = {};
				keys.forEach((key) => {
					let keyStr;
					let opts;
					if (typeof key === "string") keyStr = key;
					else if ("getValue" in key) keyStr = key.key;
					else if ("item" in key) {
						keyStr = key.item.key;
						opts = key.options;
					} else {
						keyStr = key.key;
						opts = key.options;
					}
					const { driverArea, driverKey } = resolveKey(keyStr);
					areaToKeysMap[driverArea] ??= [];
					areaToKeysMap[driverArea].push(driverKey);
					if (opts?.removeMeta) areaToKeysMap[driverArea].push(getMetaKey(driverKey));
				});
				await Promise.all(Object.entries(areaToKeysMap).map(async ([driverArea, keys]) => {
					await getDriver(driverArea).removeItems(keys);
				}));
			},
			clear: async (base) => {
				await getDriver(base).clear();
			},
			removeMeta: async (key, properties) => {
				const { driver, driverKey } = resolveKey(key);
				await removeMeta(driver, driverKey, properties);
			},
			snapshot: async (base, opts) => {
				const data = await getDriver(base).snapshot();
				opts?.excludeKeys?.forEach((key) => {
					delete data[key];
					delete data[getMetaKey(key)];
				});
				return data;
			},
			restoreSnapshot: async (base, data) => {
				await getDriver(base).restoreSnapshot(data);
			},
			watch: (key, cb) => {
				const { driver, driverKey } = resolveKey(key);
				return watch(driver, driverKey, cb);
			},
			unwatch() {
				Object.values(drivers).forEach((driver) => {
					driver.unwatch();
				});
			},
			defineItem: (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				const { version: targetVersion = 1, migrations = {}, onMigrationComplete, debug = false } = opts ?? {};
				if (targetVersion < 1) throw Error("Storage item version cannot be less than 1. Initial versions should be set to 1, not 0.");
				let needsVersionSet = false;
				const migrate = async () => {
					const driverMetaKey = getMetaKey(driverKey);
					const [{ value }, { value: meta }] = await driver.getItems([driverKey, driverMetaKey]);
					needsVersionSet = value == null && meta?.v == null && !!targetVersion;
					if (value == null) return;
					const currentVersion = meta?.v ?? 1;
					if (currentVersion > targetVersion) throw Error(`Version downgrade detected (v${currentVersion} -> v${targetVersion}) for "${key}"`);
					if (currentVersion === targetVersion) return;
					if (debug) console.debug(`[@wxt-dev/storage] Running storage migration for ${key}: v${currentVersion} -> v${targetVersion}`);
					const migrationsToRun = Array.from({ length: targetVersion - currentVersion }, (_, i) => currentVersion + i + 1);
					let migratedValue = value;
					for (const migrateToVersion of migrationsToRun) try {
						migratedValue = await migrations?.[migrateToVersion]?.(migratedValue) ?? migratedValue;
						if (debug) console.debug(`[@wxt-dev/storage] Storage migration processed for version: v${migrateToVersion}`);
					} catch (err) {
						throw new MigrationError(key, migrateToVersion, { cause: err });
					}
					await driver.setItems([{
						key: driverKey,
						value: migratedValue
					}, {
						key: driverMetaKey,
						value: {
							...meta,
							v: targetVersion
						}
					}]);
					if (debug) console.debug(`[@wxt-dev/storage] Storage migration completed for ${key} v${targetVersion}`, { migratedValue });
					onMigrationComplete?.(migratedValue, targetVersion);
				};
				const migrationsDone = opts?.migrations == null ? Promise.resolve() : migrate().catch((err) => {
					console.error(`[@wxt-dev/storage] Migration failed for ${key}`, err);
				});
				const initMutex = new Mutex();
				const getFallback = () => opts?.fallback ?? opts?.defaultValue ?? null;
				const getOrInitValue = () => initMutex.runExclusive(async () => {
					const value = await driver.getItem(driverKey);
					if (value != null || opts?.init == null) return value;
					const newValue = await opts.init();
					await driver.setItem(driverKey, newValue);
					if (value == null && targetVersion > 1) await setMeta(driver, driverKey, { v: targetVersion });
					return newValue;
				});
				migrationsDone.then(getOrInitValue);
				return {
					key,
					get defaultValue() {
						return getFallback();
					},
					get fallback() {
						return getFallback();
					},
					getValue: async () => {
						await migrationsDone;
						if (opts?.init) return await getOrInitValue();
						else return await getItem(driver, driverKey, opts);
					},
					getMeta: async () => {
						await migrationsDone;
						return await getMeta(driver, driverKey);
					},
					setValue: async (value) => {
						await migrationsDone;
						if (needsVersionSet) {
							needsVersionSet = false;
							await Promise.all([setItem(driver, driverKey, value), setMeta(driver, driverKey, { v: targetVersion })]);
						} else await setItem(driver, driverKey, value);
					},
					setMeta: async (properties) => {
						await migrationsDone;
						return await setMeta(driver, driverKey, properties);
					},
					removeValue: async (opts) => {
						await migrationsDone;
						return await removeItem(driver, driverKey, opts);
					},
					removeMeta: async (properties) => {
						await migrationsDone;
						return await removeMeta(driver, driverKey, properties);
					},
					watch: (cb) => watch(driver, driverKey, (newValue, oldValue) => cb(newValue ?? getFallback(), oldValue ?? getFallback())),
					migrate
				};
			}
		};
	}
	function createDriver(storageArea) {
		const getStorageArea = () => {
			if (browser$1.runtime == null) throw Error(`'wxt/storage' must be loaded in a web extension environment

 - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371
 - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html
`);
			if (browser$1.storage == null) throw Error("You must add the 'storage' permission to your manifest to use 'wxt/storage'");
			const area = browser$1.storage[storageArea];
			if (area == null) throw Error(`"browser.storage.${storageArea}" is undefined`);
			return area;
		};
		const watchListeners = /* @__PURE__ */ new Set();
		return {
			getItem: async (key) => {
				return (await getStorageArea().get(key))[key];
			},
			getItems: async (keys) => {
				const result = await getStorageArea().get(keys);
				return keys.map((key) => ({
					key,
					value: result[key] ?? null
				}));
			},
			setItem: async (key, value) => {
				if (value == null) await getStorageArea().remove(key);
				else await getStorageArea().set({ [key]: value });
			},
			setItems: async (values) => {
				const map = values.reduce((map, { key, value }) => {
					map[key] = value;
					return map;
				}, {});
				await getStorageArea().set(map);
			},
			removeItem: async (key) => {
				await getStorageArea().remove(key);
			},
			removeItems: async (keys) => {
				await getStorageArea().remove(keys);
			},
			clear: async () => {
				await getStorageArea().clear();
			},
			snapshot: async () => {
				return await getStorageArea().get();
			},
			restoreSnapshot: async (data) => {
				await getStorageArea().set(data);
			},
			watch(key, cb) {
				const listener = (changes) => {
					const change = changes[key];
					if (change == null || dequal(change.newValue, change.oldValue)) return;
					cb(change.newValue ?? null, change.oldValue ?? null);
				};
				getStorageArea().onChanged.addListener(listener);
				watchListeners.add(listener);
				return () => {
					getStorageArea().onChanged.removeListener(listener);
					watchListeners.delete(listener);
				};
			},
			unwatch() {
				watchListeners.forEach((listener) => {
					getStorageArea().onChanged.removeListener(listener);
				});
				watchListeners.clear();
			}
		};
	}
	var MigrationError = class extends Error {
		constructor(key, version, options) {
			super(`v${version} migration failed for "${key}"`, options);
			this.key = key;
			this.version = version;
		}
	};
	//#endregion
	//#region src/shared/storage.ts
	var DEFAULT_LASER_COLOR = "#ff2b6e";
	var DEFAULT_PEN_COLOR = "#3b82f6";
	var DEFAULT_SHAPES_COLOR = "#f97316";
	var DEFAULT_SHAPES_TYPE = "rect";
	var DEFAULT_STICKER = "😂";
	var annotationEnabledItem = storage.defineItem("local:annotationEnabled", { fallback: false });
	var currentToolItem = storage.defineItem("local:currentTool", { fallback: "laser" });
	var laserColorItem = storage.defineItem("local:laserColor", { fallback: DEFAULT_LASER_COLOR });
	var penColorItem = storage.defineItem("local:penColor", { fallback: DEFAULT_PEN_COLOR });
	var penWidthItem = storage.defineItem("local:penWidth", { fallback: 3 });
	var shapesColorItem = storage.defineItem("local:shapesColor", { fallback: DEFAULT_SHAPES_COLOR });
	var shapesTypeItem = storage.defineItem("local:shapesType", { fallback: DEFAULT_SHAPES_TYPE });
	var currentStickerItem = storage.defineItem("local:currentSticker", { fallback: DEFAULT_STICKER });
	//#endregion
	//#region src/entrypoints/content.ts
	var content_default = defineContentScript({
		matches: ["<all_urls>"],
		runAt: "document_end",
		main: async () => {
			window.visboardDebug = {
				ready: false,
				error: null
			};
			try {
				console.log("[Visboard] Content script initialized");
				const [initialColor, initialPenColor, initialShapesColor, initialSticker, initialTool, initialEnabled] = await Promise.all([
					laserColorItem.getValue(),
					penColorItem.getValue(),
					shapesColorItem.getValue(),
					currentStickerItem.getValue(),
					currentToolItem.getValue(),
					annotationEnabledItem.getValue()
				]);
				console.log("[Visboard] Initial state:", {
					initialColor,
					initialPenColor,
					initialShapesColor,
					initialSticker,
					initialTool,
					initialEnabled
				});
				const toolManager = new ToolManager();
				const laserController = new LaserController(initialColor);
				const penController = new PenController(initialPenColor);
				const shapesController = new ShapesController(initialShapesColor);
				const stickersController = new StickersController(initialSticker);
				toolManager.register("laser", laserController);
				toolManager.register("pen", penController);
				toolManager.register("shapes", shapesController);
				toolManager.register("stickers", stickersController);
				window.visboardDebug.toolManager = toolManager;
				window.visboardDebug.laserController = laserController;
				window.visboardDebug.penController = penController;
				window.visboardDebug.shapesController = shapesController;
				window.visboardDebug.stickersController = stickersController;
				if (initialEnabled && initialTool) {
					console.log("[Visboard] Auto-enabling", initialTool, "on init");
					toolManager.setEnabled(initialTool, true);
				}
				const unwatchEnabled = annotationEnabledItem.watch(async (enabled) => {
					const activeTool = await currentToolItem.getValue();
					console.log("[Visboard] Enabled changed:", {
						enabled,
						activeTool
					});
					if (!activeTool) return;
					toolManager.setEnabled(activeTool, enabled);
					[
						"laser",
						"pen",
						"shapes",
						"stickers"
					].forEach((tool) => {
						if (tool !== activeTool) toolManager.setEnabled(tool, false);
					});
				});
				const unwatchLaserColor = laserColorItem.watch((nextColor) => {
					console.log("[Visboard] Laser color changed:", nextColor);
					laserController.setLaserColor(nextColor);
				});
				const unwatchPenColor = penColorItem.watch((nextColor) => {
					console.log("[Visboard] Pen color changed:", nextColor);
					penController.setColor(nextColor);
				});
				const unwatchPenWidth = penWidthItem.watch((nextWidth) => {
					console.log("[Visboard] Pen width changed:", nextWidth);
					penController.setWidth(nextWidth);
				});
				const unwatchShapesColor = shapesColorItem.watch((nextColor) => {
					console.log("[Visboard] Shapes color changed:", nextColor);
					shapesController.setShapeColor(nextColor);
				});
				const unwatchShapesType = shapesTypeItem.watch((nextType) => {
					console.log("[Visboard] Shapes type changed:", nextType);
					shapesController.setShapeType(nextType);
				});
				const unwatchSticker = currentStickerItem.watch((nextSticker) => {
					console.log("[Visboard] Sticker changed:", nextSticker);
					stickersController.setCurrentSticker(nextSticker);
				});
				const unwatchTool = currentToolItem.watch(async (toolName) => {
					console.log("[Visboard] Tool changed:", toolName);
					if (!toolName) return;
					[
						"laser",
						"pen",
						"shapes",
						"stickers"
					].forEach((tool) => {
						if (tool !== toolName) toolManager.setEnabled(tool, false);
					});
					const enabled = await annotationEnabledItem.getValue();
					toolManager.setEnabled(toolName, enabled);
				});
				browser.runtime.onMessage.addListener((message) => {
					console.log("[Visboard] Message received:", message);
					window.visboardDebug.lastMessage = message;
					if (!message?.type) return;
					if (message.type === VISBOARD_MESSAGES.SET_ACTIVE) {
						console.log("[Visboard] Setting active:", message.enabled);
						currentToolItem.getValue().catch(() => "laser").then((tool) => {
							toolManager.setEnabled(tool || "laser", message.enabled);
						});
					} else if (message.type === VISBOARD_MESSAGES.TOGGLE_ACTIVE) {
						console.log("[Visboard] Toggling active");
						currentToolItem.getValue().catch(() => "laser").then((tool) => {
							toolManager.toggle(tool || "laser");
						});
					} else if (message.type === VISBOARD_MESSAGES.SET_TOOL) {
						console.log("[Visboard] Setting tool:", message.tool);
						currentToolItem.setValue(message.tool);
					} else if (message.type === VISBOARD_MESSAGES.SETTINGS_UPDATED) {
						console.log("[Visboard] Settings updated");
						Promise.all([
							laserColorItem.getValue().then((color) => laserController.setLaserColor(color)),
							penColorItem.getValue().then((color) => penController.setColor(color)),
							shapesColorItem.getValue().then((color) => shapesController.setShapeColor(color)),
							currentStickerItem.getValue().then((sticker) => stickersController.setCurrentSticker(sticker))
						]);
					}
				});
				addEventListener("unload", () => {
					unwatchEnabled();
					unwatchLaserColor();
					unwatchPenColor();
					unwatchPenWidth();
					unwatchShapesColor();
					unwatchShapesType();
					unwatchSticker();
					unwatchTool();
					toolManager.setEnabled("laser", false);
					toolManager.setEnabled("pen", false);
					toolManager.setEnabled("shapes", false);
					toolManager.setEnabled("stickers", false);
				});
				window.visboardDebug.ready = true;
				console.log("[Visboard] Content script fully initialized");
			} catch (error) {
				console.error("[Visboard] Content script error:", error);
				window.visboardDebug.error = error;
				throw error;
			}
		}
	});
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:content:${eventName}`;
	}
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?/Users/zkonte/Documents/GitHub/visboard-extension/src/entrypoints/content.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = content_default;
			return await main(new ContentScriptContext("content", options));
		} catch (err) {
			logger.error(`The content script "content" crashed on startup!`, err);
			throw err;
		}
	})();
})();

content;