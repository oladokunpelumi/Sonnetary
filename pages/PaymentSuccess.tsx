
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
    const [status, setStatus] = useState<'creating' | 'success' | 'error'>('creating');
    const [orderId, setOrderId] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    const reference = new URLSearchParams(window.location.search).get('reference') || new URLSearchParams(window.location.search).get('trxref');

    useEffect(() => {
        if (!reference) return;

        const briefRaw = sessionStorage.getItem('sonnetary_brief');
        const brief = briefRaw ? JSON.parse(briefRaw) : {};

        const createOrder = async () => {
            try {
                // Verify the transaction is paid
                const verifyRes = await fetch(`/api/paystack/verify/${reference}`);
                const verifyData = await verifyRes.json();

                if (!verifyData.paid) {
                    setStatus('error');
                    return;
                }

                // Create (or fetch existing) order — idempotency handled server-side
                const orderRes = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        songTitle: 'Custom Song',
                        genre: brief.genre || verifyData.metadata?.genre || '',
                        paystackReference: reference,
                        customerEmail: brief.customerEmail || verifyData.metadata?.customerEmail || '',
                        recipientType: brief.recipientType || verifyData.metadata?.recipientType || '',
                        senderName: brief.senderName || verifyData.metadata?.senderName || '',
                        voiceGender: brief.voiceGender || verifyData.metadata?.voiceGender || '',
                        specialQualities: brief.specialQualities || verifyData.metadata?.specialQualities || '',
                        favoriteMemories: brief.favoriteMemories || verifyData.metadata?.favoriteMemories || '',
                        specialMessage: brief.specialMessage || verifyData.metadata?.specialMessage || '',
                    }),
                });

                const orderData = await orderRes.json();
                const id = orderData.id;
                setOrderId(id);
                setStatus('success');

                // Persist the order ID so Track page works on this device
                sessionStorage.setItem('sonnetary_track_id', id);
                sessionStorage.removeItem('sonnetary_brief');

                // Auto-redirect to /track with the ID in the URL (shareable / cross-device)
                setTimeout(() => {
                    navigate(`/track?id=${id}`, { replace: false });
                }, 4000);
            } catch (err) {
                console.error('Order creation error:', err);
                setStatus('error');
            }
        };

        createOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reference]);

    if (!reference) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <span className="material-symbols-outlined text-6xl text-red-400">error</span>
                <h2 className="text-2xl font-bold text-white font-display">Something Went Wrong</h2>
                <p className="text-slate-400 font-body text-center">No payment reference was provided in the URL.</p>
                <Link to="/create" className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-red-600 transition-all">
                    Start Over
                </Link>
            </div>
        );
    }

    if (status === 'creating') {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
                <h2 className="text-2xl font-bold text-white font-display">Confirming Your Payment...</h2>
                <p className="text-slate-400 font-body">Please wait while we verify your payment and set up your song.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <span className="material-symbols-outlined text-6xl text-red-400">error</span>
                <h2 className="text-2xl font-bold text-white font-display">Something Went Wrong</h2>
                <p className="text-slate-400 font-body text-center">We couldn't verify your payment or create your order. Please contact support if you were charged.</p>
                <Link to="/create" className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-red-600 transition-all">
                    Try Again
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-8">
            {/* Success Animation */}
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 font-display">Payment Successful!</h2>
                <p className="text-slate-300 text-lg font-body max-w-md">
                    Your custom song is now in production. Our team of professional artists will begin composing your masterpiece.
                </p>
                <p className="text-slate-500 text-sm mt-2 font-body">Redirecting to your order page in a moment...</p>
            </div>

            <div className="bg-background-surface border border-background-border rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400 font-display">Order ID</span>
                    <span className="text-sm text-white font-mono">{orderId?.slice(0, 8).toUpperCase()}...</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400 font-display">Amount Paid</span>
                    <span className="text-sm text-white font-bold">₦30,000</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 font-display">Estimated Delivery</span>
                    <span className="text-sm text-white font-medium">~3 days</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link
                    to={orderId ? `/track?id=${orderId}` : '/track'}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-red-600 transition-all"
                >
                    <span className="material-symbols-outlined">visibility</span>
                    Track Your Order
                </Link>
                <Link to="/" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccess;
