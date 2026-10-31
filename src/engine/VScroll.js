
/**
 * VScroll — Custom Smooth Scrolling Engine
 * Version: 0.2.0
 *
 * Native browser layout is preserved.
 * Only mouse-wheel scrolling is intercepted.
 */

export default class VScroll {
  constructor(options = {}) {
    this.options = {
      smoothness: 0.085,
      wheelMultiplier: 1,
      maxDelta: 120,
      ...options,
    };

    this.current = window.scrollY;
    this.target = window.scrollY;

    this.rafId = null;
    this.lastTime = 0;
    this.isRunning = false;
    this.isDestroyed = false;

    this.motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    this.reducedMotion = this.motionQuery.matches;

    this.handleWheel = this.handleWheel.bind(this);
    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleReducedMotion = this.handleReducedMotion.bind(this);

    this.init();
  }

  init() {
    // Always listen for preference changes.
    this.motionQuery.addEventListener(
      "change",
      this.handleReducedMotion
    );

    window.addEventListener("resize", this.handleResize);

    // Keep the engine synchronized with native browser scrolling.
    window.addEventListener("scroll", this.handleScroll, {
      passive: true,
    });

    if (!this.reducedMotion) {
      this.enableWheel();
    }
  }

  enableWheel() {
    window.addEventListener("wheel", this.handleWheel, {
      passive: false,
    });
  }

  disableWheel() {
    window.removeEventListener("wheel", this.handleWheel);
  }

  handleScroll() {
    // Native keyboard, scrollbar and browser navigation support.
    // Do not overwrite the engine's target during its own animation.
    if (!this.isRunning) {
      this.current = window.scrollY;
      this.target = window.scrollY;
    }
  }

  handleWheel(event) {
    if (this.isDestroyed || this.reducedMotion) return;

    // Preserve browser zoom shortcuts.
    if (event.ctrlKey || event.metaKey) return;

    // Preserve horizontal gestures.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    // Preserve nested scrollable elements when they can scroll.
    const nestedScroller = event.composedPath().find((element) => {
      if (!(element instanceof HTMLElement)) return false;

      if (
        element === document.body ||
        element === document.documentElement
      ) {
        return false;
      }

      const style = window.getComputedStyle(element);

      return (
        /(auto|scroll)/.test(style.overflowY) &&
        element.scrollHeight > element.clientHeight
      );
    });

    if (nestedScroller) {
      const canScrollUp = nestedScroller.scrollTop > 0;

      const canScrollDown =
        nestedScroller.scrollTop + nestedScroller.clientHeight <
        nestedScroller.scrollHeight - 1;

      if (
        (event.deltaY < 0 && canScrollUp) ||
        (event.deltaY > 0 && canScrollDown)
      ) {
        return;
      }
    }

    event.preventDefault();

    // Normalize line-based and page-based wheel input.
    let delta = event.deltaY;

    if (event.deltaMode === 1) {
      delta *= 16;
    } else if (event.deltaMode === 2) {
      delta *= window.innerHeight;
    }

    delta = Math.max(
      -this.options.maxDelta,
      Math.min(this.options.maxDelta, delta)
    );

    // Synchronize before accepting a new wheel target.
    if (!this.isRunning) {
      this.current = window.scrollY;
      this.target = window.scrollY;
    }

    this.target += delta * this.options.wheelMultiplier;

    this.target = this.clampTarget(this.target);

    this.start();
  }

  clampTarget(value) {
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );

    return Math.max(0, Math.min(value, maxScroll));
  }

  start() {
    if (this.isRunning || this.isDestroyed) return;

    this.isRunning = true;
    this.lastTime = 0;

    this.rafId = requestAnimationFrame(this.animate);
  }

  animate(timestamp) {
    if (this.isDestroyed) return;

    if (!this.lastTime) {
      this.lastTime = timestamp;
    }

    const deltaTime = Math.min(
      timestamp - this.lastTime,
      32
    );

    this.lastTime = timestamp;

    const smoothing =
      1 -
      Math.pow(
        1 - this.options.smoothness,
        deltaTime / 16.67
      );

    this.current +=
      (this.target - this.current) * smoothing;

    if (Math.abs(this.target - this.current) < 0.5) {
      this.current = this.target;
    }

    window.scrollTo(0, this.current);

    if (this.current !== this.target) {
      this.rafId = requestAnimationFrame(this.animate);
    } else {
      this.isRunning = false;
      this.rafId = null;
      this.lastTime = 0;
    }
  }

  scrollTo(destination, options = {}) {
    if (this.isDestroyed) return;

    let target;

    if (typeof destination === "number") {
      target = destination;
    } else if (destination instanceof Element) {
      target =
        destination.getBoundingClientRect().top +
        window.scrollY;
    } else {
      return;
    }

    const safeTarget = this.clampTarget(target);

    if (this.reducedMotion || options.immediate) {
      this.stop();

      window.scrollTo(0, safeTarget);

      this.current = safeTarget;
      this.target = safeTarget;

      return;
    }

    this.target = safeTarget;
    this.start();
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = null;
    this.isRunning = false;
    this.lastTime = 0;
  }

  handleResize() {
    this.target = this.clampTarget(this.target);
    this.current = this.clampTarget(this.current);
  }

  handleReducedMotion(event) {
    this.reducedMotion = event.matches;

    if (this.reducedMotion) {
      this.disableWheel();
      this.stop();

      this.current = window.scrollY;
      this.target = window.scrollY;
    } else {
      this.current = window.scrollY;
      this.target = window.scrollY;

      this.enableWheel();
    }
  }

  destroy() {
    if (this.isDestroyed) return;

    this.stop();

    this.disableWheel();

    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleScroll);

    this.motionQuery.removeEventListener(
      "change",
      this.handleReducedMotion
    );

    this.isDestroyed = true;
  }
}
