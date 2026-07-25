import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { OrderData } from '../types';
import { formatCurrencyAmount } from '../constants';
import SongReady from '../components/SongReady';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';
type SignInState = 'idle' | 'sending' | 'sent' | 'error';

const OrderStatus: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLefts, setTimeLefts] = useState<
    Record<string, { days: number; hours: number; minutes: number; seconds: number }>
  >({});
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [signInState, setSignInState] = useState<SignInState>('idle');
  const [signInEmail, setSignInEmail] = useState('');
  const signInEmailRef = useRef<HTMLInputElement | null>(null);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlId = params.get('id');
    const urlToken = params.get('t');
    const trackId = urlId || sessionStorage.getItem('yourgbedu_track_id');
    const trackToken = urlToken || sessionStorage.getItem('yourgbedu_track_token');

    if (trackId && !trackId.includes('@')) {
      sessionStorage.setItem('yourgbedu_track_id', trackId);
      if (trackToken) sessionStorage.setItem('yourgbedu_track_token', trackToken);
      const tokenParam = trackToken ? `?t=${encodeURIComponent(trackToken)}` : '';
      fetch(`/api/orders/${encodeURIComponent(trackId)}${tokenParam}`, { credentials: 'include' })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setOrders([data]);
            setTimeLefts({ [data.id]: data.timeLeft });
            setAuthState('authenticated');
          } else {
            setOrders([]);
            setAuthState('unauthenticated');
          }
        })
        .catch(() => setAuthState('unauthenticated'))
        .finally(() => setLoading(false));
      return;
    }

    fetch('/api/orders/track', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          setAuthState('unauthenticated');
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data: OrderData[] = await res.json();
          setOrders(data);
          const tl: Record<string, any> = {};
          data.forEach((o) => {
            tl[o.id] = o.timeLeft;
          });
          setTimeLefts(tl);
          setAuthState('authenticated');
        }
      })
      .catch(() => setAuthState('unauthenticated'))
      .finally(() => setLoading(false));
  }, [location.search]);

  useEffect(() => {
    if (orders.length === 0) return;
    const interval = setInterval(() => {
      setTimeLefts((prev) => {
        const next = { ...prev };
        orders.forEach((order) => {
          const delivery = new Date(order.deliveryDate).getTime();
          const remainingMs = Math.max(0, delivery - Date.now());
          next[order.id] = {
            days: Math.floor(remainingMs / (1000 * 60 * 60 * 24)),
            hours: Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((remainingMs % (1000 * 60)) / 1000),
          };
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  const handleRequestSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.includes('@')) {
      setSignInState('error');
      signInEmailRef.current?.focus();
      return;
    }
    setSignInState('sending');
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail }),
      });
      setSignInState(res.ok ? 'sent' : 'error');
    } catch {
      setSignInState('error');
    }
  };

  if (loading || authState === 'checking') {
    return (
      <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center bg-ivory px-6 py-24 text-center">
        <span className="material-symbols-outlined mb-4 text-5xl text-terracotta animate-spin" aria-hidden="true">
          progress_activity
        </span>
        <p className="font-label text-sm font-bold uppercase tracking-[0.16em] text-ink-muted">
          Loading your orders...
        </p>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="bg-ivory px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-xl border-y border-line bg-cream p-6 text-center sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-terracotta-pale text-terracotta">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">
              lock
            </span>
          </div>
          <h1 className="mt-6 font-headline text-5xl font-medium leading-none text-ink">
            Sign in to view your orders
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-ink-soft">
            Enter your email and we will send you a secure sign-in link for all orders.
          </p>

          {signInState === 'sent' ? (
            <div role="status" className="mt-8 rounded-lg border border-sage-soft bg-sage-pale p-5 text-sage-dark">
              <p className="font-bold">Check your inbox.</p>
              <p className="mt-1 text-sm">
                If that email matches an order, a secure sign-in link is on the way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestSignIn} className="mt-8 flex flex-col gap-4">
              <label htmlFor="order-status-email" className="text-left text-sm font-semibold text-ink">
                Email address
              </label>
              <input
                id="order-status-email"
                ref={signInEmailRef}
                type="email"
                autoComplete="email"
                aria-invalid={signInState === 'error'}
                aria-describedby={signInState === 'error' ? 'order-status-email-error' : 'order-status-email-help'}
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-line-control bg-ivory px-5 py-4 font-body text-base text-ink placeholder:text-ink-muted focus:border-terracotta focus:bg-cream focus:outline-none focus:ring-4 focus:ring-terracotta/10"
                required
              />
              {signInState !== 'error' && <p id="order-status-email-help" className="text-left text-sm leading-6 text-ink-muted">Use the address entered during checkout.</p>}
              {signInState === 'error' && (
                <p id="order-status-email-error" role="alert" className="text-left text-sm font-medium text-red-700">Enter a valid email, then try again. If the request still fails, wait a moment and retry.</p>
              )}
              <button
                type="submit"
                disabled={signInState === 'sending'}
                className="min-h-12 rounded-full bg-ink px-6 font-label text-sm font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-terracotta disabled:opacity-50"
              >
                {signInState === 'sending' ? 'Sending...' : 'Send sign-in link'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-ivory px-6 py-24 text-center">
        <h1 className="font-headline text-5xl font-medium leading-none text-ink">
          No orders yet
        </h1>
        <p className="max-w-md text-base leading-7 text-ink-soft">
          We could not find any orders for this account. Start a new composition whenever you are ready.
        </p>
        <Link
          to="/create"
          className="rounded-full bg-ink px-7 py-3 font-label text-sm font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-terracotta"
        >
          Begin composition
        </Link>
      </div>
    );
  }

  const order = orders[0];
  const tl = timeLefts[order.id] || order.timeLeft;
  const isDelivered = order.status === 'completed' && !!order.finalSongUrl;
  const currentProductionStep = order.steps.find((item) => item.active) || order.steps[order.currentStep - 1];

  if (isDelivered) {
    return (
      <div className="bg-ivory px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <span className="rounded-full border border-line bg-cream px-3 py-1 font-label text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
              Order #{order.id.slice(0, 8)}
            </span>
            <span className="rounded-full bg-sage-pale px-3 py-1 font-label text-xs font-bold uppercase tracking-[0.14em] text-sage-dark">
              Song ready
            </span>
          </div>
          <h1 className="text-center font-headline text-5xl font-medium leading-tight text-ink sm:text-6xl">
            Your song is ready
          </h1>
          <p className="mt-3 text-center text-base leading-7 text-ink-soft">
            Press play and let it land. Share it, rate it, send a reaction — it&apos;s yours.
          </p>
          <SongReady
            order={order}
            onRatingSaved={(value) => setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, rating: value } : o)))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <section className="-mx-5 border-y border-line bg-cream px-5 py-8 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-line bg-ivory px-3 py-1 font-label text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
                  Order #{order.id.slice(0, 8)}
                </span>
                <span className={`rounded-full px-3 py-1 font-label text-xs font-bold uppercase tracking-[0.14em] ${
                  order.status === 'completed'
                    ? 'bg-sage-pale text-sage-dark'
                    : 'bg-terracotta-pale text-terracotta-dark'
                }`}>
                  {order.status === 'completed' ? 'Completed' : 'In production'}
                </span>
              </div>
              <h1 className="mt-5 font-headline text-6xl font-medium leading-none text-ink sm:text-7xl">
                {order.songTitle}
              </h1>
              <p className="mt-4 text-sm font-semibold text-terracotta-dark">
                Current stage: {currentProductionStep?.title || 'Production review'}
              </p>
              <p className="mt-6 max-w-2xl text-base leading-7 text-ink-soft">
                {currentProductionStep?.descActive || currentProductionStep?.desc || 'Your song is moving through production.'}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { val: String(tl.days).padStart(2, '0'), label: 'Days' },
                { val: String(tl.hours).padStart(2, '0'), label: 'Hours' },
                { val: String(tl.minutes).padStart(2, '0'), label: 'Minutes' },
                { val: String(tl.seconds).padStart(2, '0'), label: 'Seconds' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line bg-ivory p-3 text-center">
                  <span className="block font-mono text-3xl font-bold leading-none text-ink">
                    {item.val}
                  </span>
                  <span className="mt-2 block text-sm font-medium text-ink-muted">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 border-t border-line pt-5 text-sm font-semibold text-ink-muted">
            Estimated delivery:{' '}
            <span className="text-ink">
              {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-headline text-4xl font-medium leading-none text-ink">
                Production timeline
              </h2>
              <span className="rounded-full border border-line-strong bg-ivory px-3 py-1 text-sm font-semibold text-ink-muted">
                Step {order.currentStep} of {order.steps.length}
              </span>
            </div>

            <ol className="relative ml-5 border-l border-line-strong">
              {order.steps.map((item, i) => (
                <li
                  key={i}
                  className={`relative border-b border-line py-6 pl-9 pr-2 last:border-b-0 ${
                    item.active
                      ? 'bg-terracotta-pale/60'
                      : item.status === 'Completed'
                        ? 'bg-sage-pale/50'
                        : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`absolute -left-[22px] top-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-ivory ${
                      item.active
                        ? 'bg-terracotta text-cream'
                        : item.status === 'Completed'
                          ? 'bg-sage text-cream'
                          : 'bg-cream text-ink-muted'
                    }`}>
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">
                        {item.status === 'Completed' ? 'check' : item.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-body text-lg font-bold leading-tight text-ink">
                          {item.title}
                        </h3>
                        <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-ink-muted">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-ink-soft">
                        {item.status === 'In Progress' && item.descActive ? item.descActive : item.desc}
                      </p>
                      {item.active && (
                        <div className="mt-5">
                          <div className="mb-2 flex justify-between text-sm font-semibold text-ink-muted">
                            <span>Tracking progress</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-cream">
                            <div className="h-full rounded-full bg-terracotta" style={{ width: `${item.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="space-y-6">
            <details className="border-y border-line bg-cream py-5" open>
              <summary className="cursor-pointer text-lg font-bold text-ink">Song brief</summary>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Genre', value: order.genre },
                  ...(order.occasion
                    ? [{ label: 'Occasion', value: order.occasionDetail ? `${order.occasion} - ${order.occasionDetail}` : order.occasion }]
                    : []),
                  ...(order.recipientType
                    ? [{ label: 'For', value: order.recipientName ? `${order.recipientName} · ${order.recipientType}` : order.recipientType }]
                    : []),
                  ...(order.senderName ? [{ label: 'From', value: order.senderName }] : []),
                ].map((item) => (
                  <div key={item.label} className="border-b border-line px-1 pb-3 last:border-b-0">
                    <p className="text-sm font-semibold text-ink-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 font-body text-sm font-bold text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </details>

            <details className="bg-ink p-6 text-cream" open>
              <summary className="cursor-pointer text-base font-bold text-cream">Payment details</summary>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-3xl font-bold text-mustard-soft">
                    {formatCurrencyAmount(order.currency, order.amount)}
                  </p>
                  {typeof order.originalAmount === 'number' && order.originalAmount > order.amount && (
                    <p className="text-sm text-cream/55 line-through">
                      {formatCurrencyAmount(order.currency, order.originalAmount)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {typeof order.originalAmount === 'number' && order.originalAmount > order.amount && (
                    <span className="rounded-full bg-mustard px-3 py-1 font-label text-xs font-bold uppercase tracking-[0.12em] text-ink">
                      {order.promoDiscountPercent ? `${order.promoDiscountPercent}% off` : 'Discounted'}
                    </span>
                  )}
                  <span className="rounded-full border border-cream/30 px-3 py-1 font-label text-xs font-bold uppercase tracking-[0.12em] text-cream/80">
                    {order.fastDelivery ? 'Fast delivery · 24h' : 'Standard delivery · 48h'}
                  </span>
                </div>
              </div>
            </details>

            {orders.length > 1 && (
              <div className="border-y border-line bg-cream py-6">
                <p className="text-sm font-bold text-ink-muted">
                  All orders
                </p>
                <div className="mt-4 space-y-3">
                  {orders.map((o, i) => (
                    <div key={o.id} className={`rounded-lg border p-3 ${i === 0 ? 'border-terracotta bg-terracotta-pale' : 'border-line bg-ivory'}`}>
                      <p className="font-body text-base font-bold leading-tight text-ink">{o.songTitle}</p>
                      <p className="mt-1 text-sm font-medium text-ink-muted">
                        {o.genre} - {o.overallProgress}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
