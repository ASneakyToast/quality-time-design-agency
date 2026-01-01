/**
 * Scroll-triggered reveal animation system
 * Collins-inspired spring animations with stagger support
 */

class ScrollReveal {
  private observer: IntersectionObserver;

  constructor() {
    // More aggressive threshold to trigger earlier
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: 0.05,
        rootMargin: '50px 0px -20px 0px',
      }
    );

    this.init();
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        this.observer.unobserve(entry.target);
      }
    });
  }

  private init() {
    // Observe all elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach((el) => {
      // If element is already in viewport, trigger immediately
      const rect = el.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

      if (inViewport) {
        // Small delay to allow page to render first
        setTimeout(() => {
          el.classList.add('is-visible');
        }, 50);
      } else {
        this.observer.observe(el);
      }
    });
  }

  // Public method to manually observe new elements
  public observe(element: Element) {
    this.observer.observe(element);
  }

  // Public method to disconnect observer
  public disconnect() {
    this.observer.disconnect();
  }
}

// Initialize on DOM ready
if (typeof window !== 'undefined') {
  const initScrollReveal = () => {
    new ScrollReveal();
  };

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }

  // Astro view transitions support
  document.addEventListener('astro:page-load', initScrollReveal);
}

export { ScrollReveal };
