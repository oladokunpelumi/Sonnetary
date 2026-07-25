import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let activeModalCount = 0;
let bodyOverflowBeforeModals = '';

interface ModalDialogOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function useModalDialog({ isOpen, onClose, initialFocusRef }: ModalDialogOptions) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Callers commonly pass an inline arrow for onClose, which changes identity on
  // every parent render. If the effect depended on it, each parent re-render would
  // tear the trap down mid-dialog — restoring focus *out of* the open dialog and
  // re-capturing the restore target from whatever happened to be focused. Keeping
  // it in a ref means the effect only ever re-runs when isOpen actually flips.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const root = document.getElementById('root');
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (activeModalCount === 0) {
      bodyOverflowBeforeModals = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (root) root.inert = true;
    }
    activeModalCount += 1;

    const focusTimer = window.setTimeout(() => {
      const target = initialFocusRef?.current || dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      target?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable: HTMLElement[] = dialogRef.current
        ? Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]
        : [];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = bodyOverflowBeforeModals;
        if (root) root.inert = false;
        restoreFocusRef.current?.focus({ preventScroll: true });
      }
    };
  }, [initialFocusRef, isOpen]);

  return dialogRef;
}
