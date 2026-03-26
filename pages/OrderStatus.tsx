import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { OrderData } from '../types';

const OrderStatus: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLefts, setTimeLefts] = useState<
    Record<string, { days: number; hours: number; minutes: number; seconds: number }>
  >({});
  const [isNigeria, setIsNigeria] = useState<boolean>(true);
  const location = useLocation();

  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then((data) => setIsNigeria(!!data.isNigeria))
      .catch(() => setIsNigeria(true));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlId = params.get('id');
    const urlEmail = params.get('email');
    const trackId = urlId || urlEmail || sessionStorage.getItem('yourgbedu_track_id');

    if (!trackId) {
      setLoading(false);
      return;
    }

    sessionStorage.setItem('yourgbedu_track_id', trackId);

    const fetchOrders = async () => {
      try {
        let res;
        if (trackId.includes('@')) {
          res = await fetch(`/api/orders/track?email=${encodeURIComponent(trackId)}`);
        } else {
          res = await fetch(`/api/orders/${encodeURIComponent(trackId)}`);
        }

        if (res.ok) {
          const data = await res.json();
          const fetchedOrders = Array.isArray(data) ? data : [data];
          setOrders(fetchedOrders);
          const tl: Record<string, any> = {};
          fetchedOrders.forEach((o) => {
            tl[o.id] = o.timeLeft;
          });
          setTimeLefts(tl);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [location.search]);

  useEffect(() => {
    if (orders.length === 0) return;

    const interval = setInterval(() => {
      setTimeLefts((prev) => {
        const next = { ...prev };
        orders.forEach((order) => {
          const delivery = new Date(order.deliveryDate).getTime();
          const now = Date.now();
          const remainingMs = Math.max(0, delivery - now);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-5xl text-obsidian animate-spin mb-4">
          progress_activity
        </span>
        <p className="text-obsidian/60 text-lg font-display uppercase tracking-widest text-sm font-bold">
          Loading your orders...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <span className="material-symbols-outlined text-6xl text-obsidian/40 drop-shadow-sm">
          inbox
        </span>
        <h2 className="text-4xl md:text-5xl font-serif italic text-obsidian tracking-tight">
          No Orders Yet
        </h2>
        <p className="text-obsidian/70 text-lg font-body max-w-md">
          We couldn't find any orders matching your search. Please check your tracking ID and try
          again, or start a new composition.
        </p>
        <Link
          to="/create"
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-obsidian text-primary text-sm font-bold uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-obsidian/90 transition-all mt-4"
        >
          <span className="material-symbols-outlined text-lg">mic</span>
          Begin Composition
        </Link>
      </div>
    );
  }

  const order = orders[0];
  const tl = timeLefts[order.id] || order.timeLeft;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-12">
      {/* Cinematic Header Info */}
      <div className="relative w-full rounded-3xl overflow-hidden min-h-[450px] flex items-end p-8 md:p-12 bg-obsidian border border-obsidian/10 shadow-2xl">
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-top z-0 opacity-50 mix-blend-luminosity"
          style={{ backgroundImage: "url('/images/Composing.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/90 via-obsidian/40 to-transparent z-10" />

        <div className="relative z-20 w-full max-w-3xl flex flex-col justify-end">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-widest uppercase font-display shadow-sm backdrop-blur-sm">
              Order #{order.id.slice(0, 8)}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase font-display shadow-sm backdrop-blur-sm ${
                order.status === 'completed'
                  ? 'bg-green-900/40 border border-green-500/50 text-green-400'
                  : 'bg-obsidian/50 text-primary border border-primary/50'
              }`}
            >
              {order.status === 'completed' ? 'Completed' : 'In Production'}
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-light text-primary mb-4 tracking-tighter font-serif italic drop-shadow-xl">
            {order.songTitle}
          </h1>
          <p className="text-sm font-bold text-[#e2c15a] font-display tracking-widest uppercase mb-10 opacity-90">
            Genre: <span className="text-white mr-4">{order.genre}</span> Mood:{' '}
            <span className="text-white">{order.mood || 'Not specified'}</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: String(tl.days).padStart(2, '0'), label: 'Days' },
              { val: String(tl.hours).padStart(2, '0'), label: 'Hours' },
              { val: String(tl.minutes).padStart(2, '0'), label: 'Minutes' },
              { val: String(tl.seconds).padStart(2, '0'), label: 'Seconds', primary: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex flex-col p-4 rounded-xl border bg-obsidian/40 backdrop-blur-md shadow-lg ${item.primary ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/10'}`}
              >
                {item.primary && (
                  <div className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none" />
                )}
                <span
                  className={`text-4xl font-light font-serif tracking-tight ${item.primary ? 'text-primary' : 'text-white'}`}
                >
                  {item.val}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest mt-1 font-display ${item.primary ? 'text-primary' : 'text-white/60'}`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-[#e2c15a] font-display uppercase tracking-widest opacity-80">
            Estimated Delivery:{' '}
            <span className="text-white font-bold">
              {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 mt-4">
        <div className="lg:col-span-8">
          <h3 className="text-2xl font-serif italic text-obsidian mb-8 flex items-center gap-3">
            Production Timeline
            <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-obsidian/20 text-obsidian/70">
              Step {order.currentStep} of 5
            </span>
          </h3>
          <div className="space-y-4 relative">
            {order.steps.map((step, i) => (
              <div
                key={i}
                className={`flex flex-col md:flex-row gap-6 p-6 rounded-2xl transition-all group ${step.active ? 'bg-obsidian/5 border border-primary/40 shadow-lg shadow-black/5 backdrop-blur-sm' : step.status === 'Completed' ? 'hover:bg-obsidian/5 opacity-80 border-transparent hover:border-obsidian/10' : 'hover:bg-obsidian/5 opacity-40 border-transparent'} border`}
              >
                <div className="flex md:block items-center gap-4">
                  <div
                    className={`flex items-center justify-center size-12 rounded-full shrink-0 ${
                      step.active
                        ? 'bg-primary text-obsidian shadow-lg shadow-primary/20 scale-110 transition-transform'
                        : step.status === 'Completed'
                          ? 'bg-green-900/10 text-green-800 border-green-800/30 border'
                          : 'bg-transparent border border-obsidian/20 text-obsidian/40'
                    }`}
                  >
                    <span className="material-symbols-outlined font-light">
                      {step.status === 'Completed' ? 'check' : step.icon}
                    </span>
                  </div>
                  <div className="md:hidden h-px flex-1 bg-obsidian/10" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4
                      className={`text-xl font-serif italic ${step.active ? 'text-obsidian' : 'text-obsidian/80'}`}
                    >
                      {step.title}
                    </h4>
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                        step.active
                          ? 'bg-primary text-obsidian shadow-sm'
                          : step.status === 'Completed'
                            ? 'bg-green-900/10 text-green-900'
                            : 'bg-obsidian/5 text-obsidian/60'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="text-obsidian/80 text-sm font-body leading-relaxed">{step.desc}</p>
                  {step.active && (
                    <div className="mt-5 bg-transparent rounded-xl p-4 border border-obsidian/10">
                      <div className="flex justify-between text-[10px] text-obsidian/60 uppercase tracking-widest font-bold font-display mb-3">
                        <span>Tracking Progress</span>
                        <span className="text-primary bg-obsidian px-2 py-0.5 rounded">
                          {step.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-obsidian/10 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-primary rounded-full relative overflow-hidden"
                          style={{ width: `${step.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/40 w-full h-full animate-pulse blur-[2px]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Brief Summary Card */}
          <div className="bg-transparent border border-obsidian/20 rounded-2xl p-6 shadow-xl shadow-black/5 relative overflow-hidden backdrop-blur-sm -mb-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-obsidian/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif italic text-obsidian flex items-center gap-2 tracking-tight">
                  <span className="material-symbols-outlined text-obsidian text-2xl font-light">
                    fact_check
                  </span>
                  Song Brief
                </h3>
                <p className="text-[10px] text-obsidian/50 font-display uppercase tracking-widest mt-2 font-bold">
                  Your specifications
                </p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {[
                { icon: 'mood', label: 'Mood', value: order.mood || 'Not specified' },
                { icon: 'music_note', label: 'Genre', value: order.genre },
                {
                  icon: 'speed',
                  label: 'Tempo',
                  value: order.tempo ? `${order.tempo} BPM` : 'Not specified',
                },
                ...(order.recipientType
                  ? [{ icon: 'person', label: 'For', value: order.recipientType }]
                  : []),
                ...(order.senderName
                  ? [{ icon: 'face', label: 'From', value: order.senderName }]
                  : []),
                ...(order.voiceGender
                  ? [{ icon: 'record_voice_over', label: 'Voice', value: order.voiceGender }]
                  : []),
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-3 bg-obsidian/5 rounded-lg border border-obsidian/10"
                >
                  <span className="material-symbols-outlined text-obsidian/70 text-xl font-light">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-[9px] text-obsidian/50 uppercase tracking-widest font-display font-bold leading-none mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm text-obsidian font-serif italic">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-transparent rounded-2xl border border-obsidian/20 p-6 backdrop-blur-sm shadow-sm relative overflow-hidden mt-4">
            <h3 className="text-xl font-serif italic text-obsidian mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-obsidian text-xl font-light">
                receipt_long
              </span>
              Price Summary
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-obsidian/60 uppercase tracking-widest font-display mb-1 font-bold">
                  Custom Song
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-light font-serif tracking-tight text-obsidian">
                    {isNigeria ? '₦30,000' : '$25'}
                  </span>
                  <span className="text-sm text-obsidian/40 line-through font-display">
                    {isNigeria ? '₦60,000' : '$50'}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-obsidian text-primary text-[10px] font-bold rounded-full font-display tracking-widest uppercase shadow-lg shadow-black/10">
                50% OFF
              </span>
            </div>
          </div>

          <h3 className="text-xl font-serif italic text-obsidian tracking-tight mt-4">
            Upgrades & Extras
          </h3>
          <div className="group bg-transparent rounded-2xl border border-obsidian/20 p-6 hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined !text-7xl text-obsidian">
                rocket_launch
              </span>
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-obsidian/5 rounded-xl text-obsidian">
                <span className="material-symbols-outlined font-light">speed</span>
              </div>
              <div>
                <h4 className="text-obsidian font-serif italic text-xl mb-2">Need it sooner?</h4>
                <p className="text-obsidian/80 text-sm mb-5 font-body leading-relaxed">
                  Get your song within 48 hours for {isNigeria ? '+₦50,000' : '+$49'}. Skip the
                  queue.
                </p>
                <button className="text-[10px] font-bold bg-obsidian text-primary hover:bg-primary hover:text-obsidian border border-primary/30 px-5 py-2.5 rounded-full transition-colors uppercase tracking-widest font-display shadow-lg shadow-black/20">
                  Add Rush Delivery
                </button>
              </div>
            </div>
          </div>

          <div className="bg-transparent rounded-2xl border border-obsidian/20 p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-obsidian/5 flex items-center justify-center text-obsidian shrink-0">
              <span className="material-symbols-outlined font-light">support_agent</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-widest uppercase text-obsidian font-display">
                Have questions?
              </p>
              <a
                href="#"
                className="text-xs hover:text-obsidian/60 underline decoration-obsidian/30 text-obsidian/80 font-display transition-colors"
              >
                Chat with your producer
              </a>
            </div>
          </div>

          {orders.length > 1 && (
            <div className="bg-transparent rounded-2xl border border-obsidian/20 p-6">
              <h4 className="text-sm font-bold text-obsidian mb-4 font-display uppercase tracking-widest">
                All Orders
              </h4>
              <div className="space-y-3">
                {orders.map((o, i) => (
                  <div
                    key={o.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${i === 0 ? 'bg-obsidian/5 border border-primary/30' : 'hover:bg-obsidian/10 border border-transparent'}`}
                  >
                    <div>
                      <p className="text-sm font-serif italic text-obsidian">{o.songTitle}</p>
                      <p className="text-[10px] uppercase tracking-widest text-obsidian/60 font-bold font-display">
                        {o.genre}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded bg-obsidian text-primary`}
                    >
                      {o.overallProgress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
