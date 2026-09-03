'use client';

import { useEffect, useRef } from 'react';

/**
 * Focus management for modal dialogs and slide-in drawers.
 *
 * Without this, a keyboard or screen-reader user who opens a dialog can Tab
 * straight out of it into the page behind — which is still visible to the
 * accessibility tree but visually covered. This:
 *
 *   - moves focus into the dialog when it opens,
 *   - keeps Tab and Shift+Tab cycling inside it,
 *   - closes on Escape,
 *   - returns focus to whatever was focused before it opened.
 *
 * Attach the returned ref to the dialog's outermost element.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onClose?: () => void) {
  const containerRef = useRef<T>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    const focusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Prefer whatever the dialog marked as autofocus, else the first control.
    const initial =
      container.querySelector<HTMLElement>('[autofocus]') ?? focusable()[0] ?? container;
    // Defer so the element exists and any entry animation has started.
    const timer = window.setTimeout(() => initial.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown, true);
      // Only restore focus if it is still inside the dialog being closed;
      // otherwise the user has already moved on deliberately.
      const target = previouslyFocused.current;
      if (target && document.body.contains(target)) target.focus();
    };
  }, [active, onClose]);

  return containerRef;
}
