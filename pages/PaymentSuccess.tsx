
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
    const [status, setStatus] = useState<'creating' | 'success' | 'error'>('creating');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [amountPaid, setAmountPaid] = useState<string>('');
    const location = useLocation();
    const navigate = useNavigate();

    // Stripe: session_id is inside the hash (we control the success URL format)
    // so location.search from React Router works correctly.
    const hashParams = new URLSearchParams(location.search);
    const stripeSessionId = hashParams.get('session_id');

    // Paystack: appends params BEFORE the hash, so use window.location.search
    const urlParams = new URLSearchParams(window.location.search);
    const paystackReference = urlParams.get('reference') || urlParams.get('trxref');

    const hasReference = !!(stripeSessionId || paystackReference);

    useEffect(() => {
        if (!hasReference) return;

        const briefRaw = sessionStorage.getItem('yourgbedu_brief');
        const brief = briefRaw ? JSON.parse(briefRaw) : {};

        const finalize = (id: string) => {
            setOrderId(id);
            setStatus('success');
            sessionStorage.setItem('yourgbedu_track_id', id);
            sessionStorage.removeItem('yourgbedu_brief');
            setTimeout(() => {
                navigate(`/track?id=${id}`, { replace: false });
            }, 4000);
        };

        const createOrder = async () => {
            try {
                if (stripeSessionId) {
                    // ── Stripe flow ─────────────────────────────────────────
                    const verifyRes = await fetch(`/api/verify-session/${stripeSessionId}`);
                    const verifyData = await verifyRes.json();

                    if (!verifyData.paid) {
                        setStatus('error');
                        return;
                    }

                    setAmountPaid('$25 USD');

                    const meta = verifyData.metadata || {};
                    const orderRes = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            songTitle: 'Custom Song',
                            genre: brief.genre || meta.genre || '',
                            stripeSessionId,
                            customerEmail: brief.customerEmail || verifyData.customerEmail || meta.customerEmail || '',
                            recipientType: brief.recipientType || meta.recipientType || '',
                            senderName: brief.senderName || meta.senderName || '',
                            voiceGender: brief.voiceGender || meta.voiceGender || '',
                            specialQualities: brief.specialQualities || meta.specialQualities || '',
                            favoriteMemories: brief.favoriteMemories || meta.favoriteMemories || '',
                            specialMessage: brief.specialMessage || meta.specialMessage || '',
                        }),
                    });

                    const orderData = await orderRes.json();
                    finalize(orderData.id);
                } else {
                    // ── Paystack flow ───────────────────────────────────────
                    const verifyRes = await fetch(`/api/paystack/verify/${paystackReference}`);
                    const verifyData = await verifyRes.json();

                    if (!verifyData.paid) {
                        setStatus('error');
                        return;
                    }

                    setAmountPaid('₦30,000');

                    const orderRes = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            songTitle: 'Custom Song',
                            genre: brief.genre || verifyData.metadata?.genre || '',
                            paystackReference,
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
                    finalize(orderData.id);
                }
            } catch (err) {
                console.error('Order creation error:', err);
                setStatus('error');
            }
        };

        createOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasReference]);

    if (!hasReference) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <span className="material-symbols-outlined text-6xl text-red-400">error</span>
                <h2 className="text-2xl font-bold text-[#1C1008] font-display">Something Went Wrong</h2>
                <p className="text-[#78614A] font-body text-center">No payment reference was provided in the URL.</p>
                <Link to="/create" className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-all">
                    Start Over
                </Link>
            </div>
        );
    }

    if (status === 'creating') {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
                <h2 className="text-2xl font-bold text-[#1C1008] font-display">Confirming Your Payment...</h2>
                <p className="text-[#78614A] font-body">Please wait while we verify your payment and set up your song.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <span className="material-symbols-outlined text-6xl text-red-400">error</span>
                <h2 className="text-2xl font-bold text-[#1C1008] font-display">Something Went Wrong</h2>
                <p className="text-[#78614A] font-body text-center">We couldn't verify your payment or create your order. Please contact support if you were charged.</p>
                <Link to="/create" className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-all">
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
                <div className="relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1C1008] mb-3 font-display">Payment Successful!</h2>
                <p className="text-[#78614A] text-lg font-body max-w-md">
                    Your custom song is now in production. Our team of professional artists will begin composing your masterpiece.
                </p>
                <p className="text-[#A08B74] text-sm mt-2 font-body">Redirecting to your order page in a moment...</p>
            </div>

            <div className="bg-background-surface border border-background-border rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#A08B74] font-display">Order ID</span>
                    <span className="text-sm text-[#1C1008] font-mono">{orderId?.slice(0, 8).toUpperCase()}...</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#A08B74] font-display">Amount Paid</span>
                    <span className="text-sm text-[#1C1008] font-bold">{amountPaid}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#A08B74] font-display">Payment via</span>
                    <span className="text-sm text-[#1C1008] font-medium">{stripeSessionId ? 'Stripe' : 'Paystack'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A08B74] font-display">Estimated Delivery</span>
                    <span className="text-sm text-[#1C1008] font-medium">~3 days</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link
                    to={orderId ? `/track?id=${orderId}` : '/track'}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-all"
                >
                    <span className="material-symbols-outlined">visibility</span>
                    Track Your Order
                </Link>
                <Link to="/" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1C1008]/5 border border-background-border text-[#1C1008] font-bold hover:bg-[#1C1008]/10 transition-all">
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccess;
