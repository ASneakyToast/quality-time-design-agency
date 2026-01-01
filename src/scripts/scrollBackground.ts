/**
 * Collins-style scroll-triggered background color transitions
 * Changes body background color based on which section is most visible
 * Includes debouncing and hysteresis to prevent flickering
 */

class ScrollBackground {
  private observer: IntersectionObserver;
  private sections: Map<Element, { color: string; isDark: boolean }> = new Map();
  private currentSection: Element | null = null;
  private pendingUpdate: number | null = null;
  private lastUpdateTime: number = 0;
  private readonly minUpdateInterval = 150; // Minimum ms between updates

  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        // Larger detection zone to reduce sensitivity at boundaries
        rootMargin: '-35% 0px -35% 0px',
        threshold: [0, 0.25, 0.5],
      }
    );

    this.init();
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    // Debounce rapid updates
    if (this.pendingUpdate) {
      cancelAnimationFrame(this.pendingUpdate);
    }

    this.pendingUpdate = requestAnimationFrame(() => {
      this.processIntersection(entries);
    });
  }

  private processIntersection(entries: IntersectionObserverEntry[]) {
    const now = Date.now();

    // Throttle updates to prevent rapid switching
    if (now - this.lastUpdateTime < this.minUpdateInterval) {
      return;
    }

    // Find the section that best covers the viewport center
    const viewportCenter = window.innerHeight / 2;
    let bestSection: Element | null = null;
    let bestScore = -Infinity;

    this.sections.forEach((_, section) => {
      const rect = section.getBoundingClientRect();

      // Only consider sections that span the viewport center
      if (rect.top < viewportCenter && rect.bottom > viewportCenter) {
        // Score based on how much of the section is visible and how centered it is
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const centerDistance = Math.abs((rect.top + rect.bottom) / 2 - viewportCenter);
        const score = visibleHeight - centerDistance * 0.5;

        if (score > bestScore) {
          bestScore = score;
          bestSection = section;
        }
      }
    });

    if (bestSection && bestSection !== this.currentSection) {
      this.currentSection = bestSection;
      this.lastUpdateTime = now;
      this.updateBackground(bestSection);
    }
  }

  private updateBackground(section: Element) {
    const config = this.sections.get(section);
    if (!config) return;

    // Update background color
    document.body.style.backgroundColor = config.color;

    // Toggle dark theme for text color inversion
    if (config.isDark) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }

  private init() {
    // Find all sections with data-bg attribute
    document.querySelectorAll('[data-bg]').forEach((section) => {
      const color = section.getAttribute('data-bg') || '';
      const isDark = section.hasAttribute('data-bg-dark');

      this.sections.set(section, { color, isDark });
      this.observer.observe(section);
    });

    // Set initial background based on first visible section
    this.setInitialBackground();
  }

  private setInitialBackground() {
    const viewportCenter = window.innerHeight / 2;

    for (const [section, config] of this.sections) {
      const rect = section.getBoundingClientRect();

      if (rect.top < viewportCenter && rect.bottom > viewportCenter) {
        this.currentSection = section;
        this.updateBackground(section);
        return;
      }
    }

    // Default to first section if none spans center
    const firstSection = this.sections.keys().next().value;
    if (firstSection) {
      this.currentSection = firstSection;
      this.updateBackground(firstSection);
    }
  }

  public disconnect() {
    this.observer.disconnect();
  }
}

// Initialize on DOM ready
if (typeof window !== 'undefined') {
  const initScrollBackground = () => {
    new ScrollBackground();
  };

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollBackground);
  } else {
    initScrollBackground();
  }

  // Astro view transitions support
  document.addEventListener('astro:page-load', initScrollBackground);
}

export { ScrollBackground };
