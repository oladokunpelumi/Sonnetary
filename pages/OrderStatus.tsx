
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { OrderData } from '../types';

const OrderStatus: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLefts, setTimeLefts] = useState<Record<string, { days: number; hours: number; minutes: number; seconds: number }>>({});
  const location = useLocation();

  useEffect(() => {
    // Priority: URL param ?id= > URL param ?email= > sessionStorage
    const params = new URLSearchParams(location.search);
    const urlId = params.get('id');
    const urlEmail = params.get('email');
    const trackId = urlId || urlEmail || sessionStorage.getItem('sonnetary_track_id');

    if (!trackId) {
      setLoading(false);
      return;
    }

    // Persist to sessionStorage so refreshing still works
    sessionStorage.setItem('sonnetary_track_id', trackId);

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
          fetchedOrders.forEach(o => { tl[o.id] = o.timeLeft; });
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

  // Live countdown timer
  useEffect(() => {
    if (orders.length === 0) return;

    const interval = setInterval(() => {
      setTimeLefts(prev => {
        const next = { ...prev };
        orders.forEach(order => {
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
        <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">progress_activity</span>
        <p className="text-slate-400 text-lg font-display">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <span className="material-symbols-outlined text-6xl text-slate-600">inbox</span>
        <h2 className="text-3xl font-bold text-white font-display">No Orders Yet</h2>
        <p className="text-slate-400 text-lg font-body max-w-md text-center">
          We couldn't find any orders matching your search. Please check your tracking ID and try again, or start a new composition.
        </p>
        <Link to="/create" className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-white font-bold shadow-lg hover:bg-red-600 transition-all">
          <span className="material-symbols-outlined">mic</span>
          Begin Composition
        </Link>
      </div>
    );
  }

  const order = orders[0]; // Show most recent order prominently
  const tl = timeLefts[order.id] || order.timeLeft;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-12">
      {/* Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col justify-end">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 tracking-wide uppercase font-display">
              Order #{order.id.slice(0, 8)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase font-display ${order.status === 'completed'
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-primary/20 border border-primary/30 text-primary'
              }`}>
              {order.status === 'completed' ? 'Completed' : 'In Production'}
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-2 tracking-tight font-display">{order.songTitle}</h1>
          <p className="text-xl text-white/60 font-light mb-8">
            Genre: {order.genre} • Mood: {order.mood || 'Not specified'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: String(tl.days).padStart(2, '0'), label: 'Days' },
              { val: String(tl.hours).padStart(2, '0'), label: 'Hours' },
              { val: String(tl.minutes).padStart(2, '0'), label: 'Minutes' },
              { val: String(tl.seconds).padStart(2, '0'), label: 'Seconds', primary: true },
            ].map(item => (
              <div key={item.label} className={`flex flex-col p-4 bg-background-surface rounded-xl border border-white/5 ${item.primary ? 'relative overflow-hidden group' : ''}`}>
                {item.primary && <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />}
                <span className={`text-3xl font-bold font-display ${item.primary ? 'text-primary' : 'text-white'}`}>{item.val}</span>
                <span className={`text-xs uppercase tracking-wider mt-1 font-display ${item.primary ? 'text-primary/60' : 'text-white/40'}`}>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/40 font-display">
            Estimated Delivery: <span className="text-white/80 font-medium">{new Date(order.deliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>

        {/* Brief Summary Card */}
        <div className="lg:col-span-5">
          <div className="bg-gradient-to-b from-background-surface to-background rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                  Brief Summary
                </h3>
                <p className="text-sm text-white/50 font-body">Your song specifications</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-primary text-lg">mood</span>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-display">Mood</p>
                  <p className="text-sm text-white font-medium">{order.mood || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-primary text-lg">music_note</span>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-display">Genre</p>
                  <p className="text-sm text-white font-medium">{order.genre}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-primary text-lg">speed</span>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-display">Tempo</p>
                  <p className="text-sm text-white font-medium">{order.tempo} BPM</p>
                </div>
              </div>
              {order.story && (
                <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-display mb-1">Your Story</p>
                  <p className="text-sm text-white/70 font-body line-clamp-3">{order.story}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-display">
            Production Timeline
            <span className="text-xs font-normal px-2 py-0.5 rounded border border-white/20 text-white/60">Step {order.currentStep} of 5</span>
          </h3>
          <div className="space-y-4 relative">
            {order.steps.map((step, i) => (
              <div key={i} className={`flex flex-col md:flex-row gap-6 p-6 rounded-xl transition-all group ${step.active ? 'bg-background-surface border border-primary/30 shadow-lg' : step.status === 'Completed' ? 'hover:bg-white/5 opacity-80' : 'hover:bg-white/5 opacity-40'}`}>
                <div className="flex md:block items-center gap-4">
                  <div className={`flex items-center justify-center size-12 rounded-full shrink-0 ${step.active ? 'bg-primary text-white animate-pulse' :
                    step.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      'bg-background-surface border border-white/10 text-white/40'
                    }`}>
                    <span className="material-symbols-outlined">
                      {step.status === 'Completed' ? 'check' : step.icon}
                    </span>
                  </div>
                  <div className="md:hidden h-px flex-1 bg-white/10" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-lg font-bold text-white font-display">{step.title}</h4>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${step.active ? 'bg-primary text-white animate-pulse' :
                      step.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                        'bg-white/10 text-white/40'
                      }`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm font-body">{step.desc}</p>
                  {step.active && (
                    <div className="mt-4 bg-black/20 rounded-lg p-3 border border-white/5">
                      <div className="flex justify-between text-xs text-white/60 mb-2 font-display">
                        <span>Tracking Progress</span>
                        <span>{step.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full relative overflow-hidden" style={{ width: `${step.progress}%` }}>
                          <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer" />
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
          <h3 className="text-xl font-bold text-white font-display">Upgrades & Extras</h3>
          <div className="group bg-background-surface rounded-xl border border-white/10 p-5 hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined !text-6xl text-primary">rocket_launch</span>
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined">speed</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg mb-1 font-display">Need it sooner?</h4>
                <p className="text-white/60 text-sm mb-4 font-body">Get your song within 48 hours for +$49. Skip the queue.</p>
                <button className="text-xs font-bold bg-white text-background hover:bg-primary hover:text-white px-4 py-2 rounded transition-colors uppercase tracking-wide font-display">
                  Add Rush Delivery
                </button>
              </div>
            </div>
          </div>

          <div className="bg-background-surface rounded-xl border border-white/10 p-5 flex items-center gap-3">
            <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white font-display">Have questions?</p>
              <a href="#" className="text-xs hover:text-primary underline decoration-primary/50 text-white/40 font-display">Chat with your producer</a>
            </div>
          </div>

          {/* All Orders List */}
          {orders.length > 1 && (
            <div className="bg-background-surface rounded-xl border border-white/10 p-5">
              <h4 className="text-sm font-bold text-white mb-3 font-display">All Orders</h4>
              <div className="space-y-2">
                {orders.map((o, i) => (
                  <div
                    key={o.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${i === 0 ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5'}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{o.songTitle}</p>
                      <p className="text-xs text-white/40">{o.genre}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${o.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'}`}>
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
