import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Mail } from 'lucide-react';
import { useModalDialog } from '../hooks/useModalDialog';
import { useOverlay } from '../contexts/OverlayContext';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'sending' | 'sent' | 'error';

const FULL_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getApiError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data?.error || data?.message || fallback;
}

const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('input');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lookupEmailRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { setLayerOpen } = useOverlay();

  const handleClose = useCallback(() => {
    setIdentifier('');
    setLookupEmail('');
    setNeedsEmail(false);
    setModalState('input');
    setErrorMessage('');
    onClose();
  }, [onClose]);

  const dialogRef = useModalDialog({ isOpen, onClose: handleClose, initialFocusRef: inputRef });

  useEffect(() => {
    setLayerOpen('task-dialog', isOpen);
    return () => setLayerOpen('task-dialog', false);
  }, [isOpen, setLayerOpen]);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = identifier.trim().replace(/^#/, '');
    if (!value) {
      setErrorMessage('Please enter an Order ID or Email.');
      inputRef.current?.focus();
      return;
    }

    setErrorMessage('');

    const isEmail = value.includes('@');

    if (isEmail) {
      // Email-only: send a magic link listing every order on that address.
      setModalState('sending');
      try {
        const res = await fetch('/api/auth/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value }),
        });
        setModalState(res.ok ? 'sent' : 'error');
        if (!res.ok) {
          setErrorMessage(await getApiError(res, 'Something went wrong. Please try again.'));
        }
      } catch {
        setModalState('error');
        setErrorMessage('Network error. Please try again.');
      }
      return;
    }

    if (FULL_UUID_RE.test(value)) {
      // A full order ID is an unguessable capability — open it directly.
      sessionStorage.setItem('yourgbedu_track_id', value);
      handleClose();
      navigate(`/track?id=${encodeURIComponent(value)}`);
      return;
    }

    // Short order number (the #A1B2C3D4 from emails): pair it with the order's
    // email for an instant lookup — no inbox round-trip needed.
    if (!needsEmail) {
      setNeedsEmail(true);
      window.setTimeout(() => lookupEmailRef.current?.focus(), 0);
      return;
    }
    const email = lookupEmail.trim();
    if (!email.includes('@')) {
      setErrorMessage('Enter the email you used on the order.');
      lookupEmailRef.current?.focus();
      return;
    }
    setModalState('sending');
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: value, email }),
      });
      if (!res.ok) {
        setModalState('input');
        setErrorMessage(await getApiError(res, 'No order matches that number and email.'));
        return;
      }
      const order = await res.json();
      sessionStorage.setItem('yourgbedu_track_id', order.id);
      handleClose();
      const tokenParam = order.trackingToken ? `&t=${encodeURIComponent(order.trackingToken)}` : '';
      navigate(`/track?id=${encodeURIComponent(order.id)}${tokenParam}`);
    } catch {
      setModalState('input');
      setErrorMessage('Network error. Please try again.');
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-cream p-6 shadow-[0_18px_44px_rgba(31,27,20,0.2)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-order-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-line-control text-ink-muted transition-colors hover:border-terracotta hover:text-ink"
          aria-label="Close order tracking"
        >
          <X className="w-5 h-5" />
        </button>

        {modalState === 'sent' ? (
          <div role="status" className="text-center py-4 flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-pale">
              <Mail className="h-8 w-8 text-sage-dark" />
            </div>
            <h2 id="track-order-title" className="font-headline text-4xl font-medium leading-none text-ink">
              Check your inbox
            </h2>
            <p className="font-body text-sm leading-6 text-ink-soft">
              If <strong>{identifier}</strong> matches an order, a secure sign-in link is on the
              way. Open it to view every order attached to that email.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 font-label text-sm font-bold text-terracotta underline hover:text-terracotta-dark"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6 pt-2">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-pale">
                <Search className="h-7 w-7 text-terracotta" />
              </div>
              <h2 id="track-order-title" className="font-headline text-4xl font-medium leading-none text-ink">
                Track your song
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-ink-soft">
                Enter your Order ID to open that order, or your email to receive a secure link for all orders.
              </p>
            </div>

            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label htmlFor="track-order-identifier" className="mb-2 block text-sm font-semibold text-ink">
                  Order ID or email address
                </label>
                <input
                  id="track-order-identifier"
                  ref={inputRef}
                  type="text"
                  autoComplete="email"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={`track-order-help${errorMessage ? ' track-order-error' : ''}`}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMessage('');
                    if (modalState === 'error') setModalState('input');
                  }}
                  placeholder="Order ID or email@example.com"
                  className="w-full rounded-xl border border-line-control bg-ivory px-4 py-3.5 font-body text-ink placeholder:text-ink-muted transition-colors focus:border-terracotta focus:bg-cream focus:outline-none focus:ring-4 focus:ring-terracotta/10"
                />
                <p id="track-order-help" className="mt-2 px-1 text-sm leading-6 text-ink-muted">
                  Use the full ID from your receipt, or enter your email to request a secure sign-in link.
                </p>
                {needsEmail && !identifier.includes('@') && (
                  <div className="mt-3">
                    <label htmlFor="track-order-email" className="mb-2 block text-sm font-semibold text-ink">
                      Email used on the order
                    </label>
                    <input
                      id="track-order-email"
                      ref={lookupEmailRef}
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={`track-order-email-help${errorMessage ? ' track-order-error' : ''}`}
                      value={lookupEmail}
                      onChange={(e) => {
                        setLookupEmail(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Email used on the order"
                      className="w-full rounded-xl border border-line-control bg-ivory px-4 py-3.5 font-body text-ink placeholder:text-ink-muted transition-colors focus:border-terracotta focus:bg-cream focus:outline-none focus:ring-4 focus:ring-terracotta/10"
                    />
                    <p id="track-order-email-help" className="mt-2 px-1 text-sm leading-6 text-ink-muted">
                      Short order numbers need the matching email — no sign-in link required.
                    </p>
                  </div>
                )}
                {errorMessage && (
                  <p id="track-order-error" role="alert" className="mt-2 px-1 text-sm font-medium text-red-700">{errorMessage}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={modalState === 'sending' || !identifier.trim()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-label text-sm font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-50"
              >
                {modalState === 'sending' ? (
                  <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="sr-only">Sending request</span></>
                ) : identifier.includes('@') ? (
                  'Send Sign-in Link'
                ) : needsEmail ? (
                  'Find My Order'
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TrackOrderModal;
