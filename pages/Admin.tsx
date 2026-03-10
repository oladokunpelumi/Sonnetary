import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface Order {
    id: string;
    song_title: string;
    genre: string;
    mood: string;
    tempo: number;
    story: string;
    status: string;
    created_at: string;
    delivery_date: string;
    paystack_reference: string;
    amount: number;
    recipient_type: string;
    sender_name: string;
    voice_gender: string;
    special_qualities: string;
    favorite_memories: string;
    special_message: string;
    customer_email: string;
    ai_brief: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    songCount: number;
}

const STATUS_COLORS: Record<string, string> = {
    in_production: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const Admin: React.FC = () => {
    const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('admin_token'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                setAdminToken(data.token);
                localStorage.setItem('admin_token', data.token);
            } else {
                setLoginError('Invalid credentials');
            }
        } catch (err) {
            setLoginError('An error occurred during log in.');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem('admin_token');
        setAdminToken(null);
    }, []);

    const fetchData = useCallback(async (authToken: string, page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '25' });
            if (statusFilter) params.set('status', statusFilter);
            if (search) params.set('search', search);

            const [ordersRes, statsRes] = await Promise.all([
                fetch(`/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${authToken}` } }),
                fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${authToken}` } }),
            ]);

            if (ordersRes.status === 401 || ordersRes.status === 403) {
                logout();
                return;
            }

            const [ordersPayload, statsData] = await Promise.all([ordersRes.json(), statsRes.json()]);
            setOrders(ordersPayload.data ?? ordersPayload);
            setPagination(ordersPayload.pagination ?? null);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [logout, statusFilter, search]);

    useEffect(() => {
        if (adminToken) {
            fetchData(adminToken, currentPage);
        }
    }, [adminToken, fetchData, currentPage]);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (!adminToken) return;
        setUpdatingId(orderId);
        try {
            await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({ status: newStatus }),
            });
            await fetchData(adminToken);
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    if (!adminToken) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-8 flex flex-col items-center justify-center">
                <div className="max-w-md w-full glass-card p-10 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <div className="relative text-center mb-8">
                        <span className="material-symbols-outlined text-4xl text-primary/80 mb-4 block">admin_panel_settings</span>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 font-display">
                            Admin Login
                        </h2>
                        <p className="text-slate-400 text-sm mt-3 font-body">Sign in to manage orders</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5 relative">
                        {loginError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {loginError}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-1 mb-2 block font-display">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-background border border-background-border rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body text-sm"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-1 mb-2 block font-display">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-background-border rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-rose-400 text-white font-bold transition-all hover:shadow-[0_0_20px_rgba(255,107,107,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group/btn overflow-hidden font-display tracker-wider mt-6"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 text-sm uppercase">
                                {isLoading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Access Dashboard
                                        <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform text-lg">arrow_forward</span>
                                    </>
                                )}
                            </span>
                        </button>
                        <div className="pt-6 text-center">
                            <Link to="/" className="text-xs text-slate-500 hover:text-white transition-colors">
                                ← Back to Home
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Admin Header */}
            <header className="bg-background-surface border-b border-background-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                    <span className="font-bold text-white font-display">Sonnetary Admin</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => adminToken && fetchData(adminToken)}
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">refresh</span>
                        Refresh
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Log Out
                    </button>
                    <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors ml-4 border-l border-background-border pl-4">
                        ← Site
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Orders', value: stats.totalOrders, icon: 'receipt_long', color: 'text-blue-400' },
                            { label: 'Total Revenue', value: `₦${(stats.totalRevenue / 100).toLocaleString('en-NG')}`, icon: 'payments', color: 'text-green-400' },
                            { label: 'Songs in Library', value: stats.songCount, icon: 'library_music', color: 'text-primary' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-background-surface border border-background-border rounded-xl p-6 flex items-center gap-4">
                                <div className="size-12 bg-background rounded-xl flex items-center justify-center">
                                    <span className={`material-symbols-outlined text-2xl ${stat.color}`}>{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider font-display">{stat.label}</p>
                                    <p className="text-2xl font-bold text-white font-display">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Orders Table */}
                <div className="bg-background-surface border border-background-border rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-background-border flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                        <h2 className="font-bold text-white font-display">All Orders</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="text"
                                placeholder="Search name / email / ID..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="bg-background border border-background-border rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary w-48"
                            />
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="bg-background border border-background-border rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">All statuses</option>
                                <option value="in_production">In Production</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <span className="text-xs text-slate-500">{pagination ? `${pagination.total} orders` : `${orders.length} orders`}</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-16 gap-3">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 gap-3 text-slate-500">
                            <span className="material-symbols-outlined text-4xl">inbox</span>
                            <p>No orders yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-background-border">
                            {orders.map((order) => (
                                <div key={order.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="size-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-primary text-lg">music_note</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-white font-bold font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status] || STATUS_COLORS.in_production}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-xs mt-0.5 truncate">
                                                    {order.genre || 'Custom'} · {order.voice_gender || order.mood || 'Custom'} ·{' '}
                                                    {new Date(order.created_at).toLocaleDateString('en-NG')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-sm font-bold text-white">
                                                ₦{(order.amount / 100).toLocaleString('en-NG')}
                                            </span>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                disabled={updatingId === order.id}
                                                className="bg-background border border-background-border rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                            >
                                                <option value="in_production">In Production</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <button
                                                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                                className="size-8 flex items-center justify-center rounded-lg bg-background border border-background-border text-slate-400 hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {expandedId === order.id ? 'expand_less' : 'expand_more'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {expandedId === order.id && (
                                        <div className="mt-4 bg-background rounded-xl p-4 text-sm space-y-4 border border-background-border">
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-background-border">
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase tracking-wider">For</span>
                                                    <p className="text-white font-medium">{order.recipient_type || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase tracking-wider">From</span>
                                                    <p className="text-white font-medium">{order.sender_name || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase tracking-wider">Voice</span>
                                                    <p className="text-white font-medium">{order.voice_gender || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase tracking-wider">Delivery Date</span>
                                                    <p className="text-white font-medium">{new Date(order.delivery_date).toLocaleDateString('en-NG')}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-slate-500 text-xs uppercase tracking-wider">Payment Ref</span>
                                                    <p className="text-white font-mono text-xs break-all">{order.paystack_reference || '—'}</p>
                                                </div>
                                            </div>

                                            {/* Story Details */}
                                            <div className="space-y-4">
                                                {order.special_qualities && (
                                                    <div>
                                                        <span className="text-primary text-xs uppercase tracking-wider font-bold mb-1 block">Special Qualities</span>
                                                        <p className="text-white leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{order.special_qualities}</p>
                                                    </div>
                                                )}
                                                {order.favorite_memories && (
                                                    <div>
                                                        <span className="text-primary text-xs uppercase tracking-wider font-bold mb-1 block">Favorite Memories</span>
                                                        <p className="text-white leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{order.favorite_memories}</p>
                                                    </div>
                                                )}
                                                {order.special_message && (
                                                    <div>
                                                        <span className="text-primary text-xs uppercase tracking-wider font-bold mb-1 block">Special Message</span>
                                                        <p className="text-white leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{order.special_message}</p>
                                                    </div>
                                                )}
                                                {order.story && !order.special_qualities && (
                                                    <div>
                                                        <span className="text-primary text-xs uppercase tracking-wider font-bold mb-1 block">Story Brief (Legacy)</span>
                                                        <p className="text-white leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{order.story}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* AI Production Brief */}
                                            {order.ai_brief ? (
                                                <div className="pt-4 border-t border-background-border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-base text-violet-400">auto_awesome</span>
                                                        <span className="text-violet-400 text-xs uppercase tracking-wider font-bold">AI Production Brief</span>
                                                    </div>
                                                    <p className="text-white/90 leading-relaxed bg-violet-500/5 border border-violet-500/20 p-3 rounded-lg whitespace-pre-wrap text-sm">{order.ai_brief}</p>
                                                </div>
                                            ) : (
                                                <div className="pt-4 border-t border-background-border flex items-center gap-2 text-slate-600 text-xs">
                                                    <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                                                    AI brief pending generation
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-background-border flex items-center justify-between gap-4">
                            <span className="text-xs text-slate-500 font-display">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); }}
                                    disabled={!pagination.hasPrev}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background border border-background-border text-sm text-white disabled:opacity-40 hover:border-primary/50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                    Prev
                                </button>
                                <button
                                    onClick={() => { setCurrentPage(p => p + 1); }}
                                    disabled={!pagination.hasNext}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background border border-background-border text-sm text-white disabled:opacity-40 hover:border-primary/50 transition-colors"
                                >
                                    Next
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;
