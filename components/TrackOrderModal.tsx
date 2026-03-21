import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';

interface TrackOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose }) => {
    const [identifier, setIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!identifier.trim()) {
            setError('Please enter an Order ID or Email.');
            return;
        }

        setIsLoading(true);

        try {
            let isEmail = identifier.includes('@');
            let foundOrders = false;

            if (isEmail) {
                const res = await fetch(`/api/orders/track?email=${encodeURIComponent(identifier)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) foundOrders = true;
                }
            } else {
                const res = await fetch(`/api/orders/${encodeURIComponent(identifier)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.id) foundOrders = true;
                }
            }

            if (foundOrders) {
                sessionStorage.setItem('yourgbedu_track_id', identifier);
                onClose();
                navigate('/track');
            } else {
                setError('No orders found matching this information.');
            }
        } catch (err) {
            setError('Failed to track order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1C1008]/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-background border border-background-border rounded-2xl p-6 relative shadow-2xl shadow-[#1C1008]/10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#A08B74] hover:text-[#1C1008] transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6 pt-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Search className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1C1008] font-display">Track Your Song</h2>
                    <p className="text-[#78614A] text-sm mt-2 font-body">
                        Enter your Order ID or Email Address to see your song's production status.
                    </p>
                </div>

                <form onSubmit={handleTrack} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="e.g. order_12345 or hello@example.com"
                            className="w-full bg-background-surface border border-background-border rounded-xl px-4 py-3.5 text-[#1C1008] placeholder-[#A08B74] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-body"
                        />
                        {error && <p className="text-red-500 text-sm mt-2 px-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !identifier.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-white font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm font-display mt-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Find My Order'
                        )}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default TrackOrderModal;
