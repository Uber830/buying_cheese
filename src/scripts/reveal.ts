const REVEAL_SELECTOR = '[data-reveal]';
const COUNTER_SELECTOR = '[data-counter]';
const HEADER_SELECTOR = '[data-header]';
const REVEALED = 'data-revealed';
const COUNTERED = 'data-countered';
const NAV_HIDDEN = 'data-nav-hidden';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupReveal(): void {
  if (reduceMotion) {
    document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
      el.setAttribute(REVEALED, 'true');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.setAttribute(REVEALED, 'true');
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  const watch = (root: ParentNode = document) => {
    root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
      if (!el.hasAttribute(REVEALED)) observer.observe(el);
    });
  };

  watch();

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches(REVEAL_SELECTOR) && !node.hasAttribute(REVEALED)) {
          observer.observe(node);
        }
        watch(node);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CO').format(Math.round(n));
}

function animateCounter(el: HTMLElement): void {
  if (el.hasAttribute(COUNTERED)) return;
  el.setAttribute(COUNTERED, 'true');

  const target = Number(el.dataset.counterValue ?? '0');
  const prefix = el.dataset.counterPrefix ?? '';
  const suffix = el.dataset.counterSuffix ?? '';
  if (!Number.isFinite(target)) return;

  if (reduceMotion) {
    el.textContent = `${prefix}${formatNumber(target)}${suffix}`;
    return;
  }

  const duration = 1200;
  const start = performance.now();

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const value = target * easeOutCubic(t);
    el.textContent = `${prefix}${formatNumber(value)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = `${prefix}${formatNumber(target)}${suffix}`;
  };

  requestAnimationFrame(tick);
}

function setupCounters(): void {
  const run = (el: HTMLElement) => animateCounter(el);

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target as HTMLElement);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  const watch = (root: ParentNode = document) => {
    root.querySelectorAll<HTMLElement>(COUNTER_SELECTOR).forEach((el) => {
      if (!el.hasAttribute(COUNTERED)) counterObserver.observe(el);
    });
  };

  watch();

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches(COUNTER_SELECTOR) && !node.hasAttribute(COUNTERED)) {
          counterObserver.observe(node);
        }
        watch(node);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

function setupNavbar(): void {
  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;
  const threshold = 80;
  const delta = 6;

  const update = () => {
    const y = window.scrollY;
    const goingDown = y > lastY && y > threshold;
    const goingUp = y < lastY && Math.abs(y - lastY) > delta;
    const menuOpen = header.hasAttribute('data-menu-open');

    if (!menuOpen) {
      if (goingDown) header.setAttribute(NAV_HIDDEN, 'true');
      else if (goingUp || y < threshold) header.removeAttribute(NAV_HIDDEN);
    }

    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

setupReveal();
setupCounters();
setupNavbar();
