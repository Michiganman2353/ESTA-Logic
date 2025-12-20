/**
 * Focus Manager - Accessibility focus management
 *
 * Manages keyboard focus for wizard steps and interactive elements
 * Ensures proper focus handling for screen readers and keyboard navigation
 */

export interface FocusableElement extends HTMLElement {
  focus(): void;
}

export const focusManager = {
  /**
   * Focus the first focusable element in a container
   */
  focusFirst(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    if (firstElement) {
      firstElement.focus();
    }
  },

  /**
   * Focus the main heading of a step
   */
  focusHeading(headingId?: string): void {
    const heading = headingId
      ? document.getElementById(headingId)
      : document.querySelector('h1');

    if (heading && heading instanceof HTMLElement) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
      // Remove tabindex after focus to restore natural tab order
      setTimeout(() => heading.removeAttribute('tabindex'), 100);
    }
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): FocusableElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(
      container.querySelectorAll(selector)
    ) as FocusableElement[];
  },

  /**
   * Trap focus within a container (for modals, dialogs)
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !firstElement || !lastElement) return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Announce to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer =
      document.getElementById('a11y-announcer') || this.createAnnouncer();
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  },

  /**
   * Create screen reader announcer element
   */
  createAnnouncer(): HTMLElement {
    const announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    return announcer;
  },

  /**
   * Restore focus to a previously focused element
   */
  saveFocus(): () => void {
    const activeElement = document.activeElement as FocusableElement;

    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },
};
