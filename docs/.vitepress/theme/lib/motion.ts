export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * FLIP: measure, change the layout, then animate each element from where it was.
 * A small overshoot gives the parts a sense of weight. Skipped under reduced motion.
 */
export function flip(elements: HTMLElement[], mutate: () => void): void {
  if (prefersReducedMotion()) {
    mutate();
    return;
  }
  const first = elements.map((el) => el.getBoundingClientRect());
  mutate();
  elements.forEach((el, i) => {
    const before = first[i];
    if (!before) return;
    const after = el.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    if (!dx && !dy) return;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.forEach((el, i) => {
        el.style.transition = `transform 420ms var(--ease-spring) ${i * 24}ms`;
        el.style.transform = "";
      });
    });
  });
}

/** Restarts a CSS animation class, e.g. to flash the check digit again. */
export function replay(el: HTMLElement | null | undefined, className: string): void {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}
