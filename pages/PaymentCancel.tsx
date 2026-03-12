
import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancel: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="w-24 h-24 rounded-full bg-background-surface border border-background-border flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-[#A08B74]">close</span>
            </div>

            <div className="text-center">
                <h2 className="text-3xl font-bold text-[#1C1008] mb-3 font-display">Payment Cancelled</h2>
                <p className="text-[#78614A] text-lg font-body max-w-md">
                    No worries — your song brief has been saved. You can pick up right where you left off whenever you're ready.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link to="/create" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-all">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Return to Brief
                </Link>
                <Link to="/" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1C1008]/5 border border-background-border text-[#1C1008] font-bold hover:bg-[#1C1008]/10 transition-all">
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default PaymentCancel;
