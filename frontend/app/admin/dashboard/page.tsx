'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/axios';
import { Icons } from '@/components/Icons';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAdminOdds } from '@/hooks/useAdminOdds';

// ─── Types ───────────────────────────────────────────
interface Match {
    id: string;
    name: string;
    teamA: string;
    teamB: string;
    startTime: any;
    status: string;
    score?: any;
}

// ─── Sidebar Component ──────────────────────────────
function AdminSidebar({ activeModule, setActiveModule, collapsed, onClose }: { activeModule: string, setActiveModule: (m: string) => void, collapsed: boolean, onClose?: () => void }) {
    const sections = [
        {
            title: 'MATCH MANAGEMENT',
            items: [
                { id: 'live_discover', label: 'Match Discovery', icon: <Icons.Search /> },
                { id: 'in_play', label: 'In-Play Management', icon: <Icons.Games /> },
            ]
        }
    ];

    return (
        <aside className="dashboard-sidebar" style={{
            width: collapsed ? '80px' : '260px',
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 40,
            boxShadow: '4px 0 12px rgba(0,0,0,0.02)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{ padding: collapsed ? '24px 0' : '24px 32px', borderBottom: '1px solid var(--border)', textAlign: 'center', overflow: 'hidden' }}>
                <span onClick={() => setActiveModule('in_play')} style={{
                    fontWeight: 900, fontSize: collapsed ? '16px' : '18px', color: 'var(--accent)', letterSpacing: '-0.04em', cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                    {collapsed ? 'BX' : 'BetX Admin'}
                </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '24px 8px' : '24px 16px', overflowX: 'hidden' }}>
                {sections.map((section) => (
                    <div key={section.title} style={{ marginBottom: '28px' }}>
                        {!collapsed && <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '16px' }}>{section.title}</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {section.items.map((item) => (
                                <button key={item.id} onClick={() => { setActiveModule(item.id); onClose?.(); }} title={collapsed ? item.label : ''} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: collapsed ? '0' : '12px',
                                    padding: collapsed ? '12px 0' : '10px 16px', borderRadius: '8px', border: 'none',
                                    background: activeModule === item.id ? 'var(--accent)' : 'transparent',
                                    color: activeModule === item.id ? 'white' : 'var(--text-secondary)',
                                    fontSize: '13px', fontWeight: activeModule === item.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%'
                                }}>
                                    <span style={{ opacity: activeModule === item.id ? 1 : 0.7, display: 'flex' }}>{item.icon}</span>
                                    {!collapsed && <span>{item.label}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}

// ─── Module: Live Match Discover ─────────────────────
function LiveMatchDiscover() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState<string | null>(null);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/cricket/matches');
            if (res.data.success) setMatches(res.data.data);
        } catch (err) {
            console.error('Fetch live matches failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMatches(); }, []);

    const handleImport = async (match: any) => {
        setImporting(match.id);
        try {
            const res = await api.post('/api/admin/cricket/import', { match });
            if (res.data.success) {
                alert('Match imported successfully!');
            }
        } catch (err) {
            alert('Import failed');
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="smooth-transition">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Match Discovery</h1>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Sync Live Games from API</div>
                </div>
                <button onClick={fetchMatches} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer'
                }}>
                    <Icons.Refresh /> Refresh List
                </button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Teams</th>
                            <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Start Time</th>
                            <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={4} style={{ padding: '24px', textAlign: 'center', opacity: 0.3 }}>Loading...</td></tr>
                            ))
                        ) : (
                            matches.map((m) => (
                                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px 24px', fontWeight: 700 }}>{m.name}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: m.status === 'Live' ? '#ef4444' : '#3b82f6', color: 'white', fontSize: '10px', fontWeight: 800 }}>{m.status}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{new Date(m.startTime).toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <button
                                            disabled={importing === m.id}
                                            onClick={() => handleImport(m)}
                                            style={{
                                                padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', opacity: importing === m.id ? 0.5 : 1
                                            }}
                                        >
                                            {importing === m.id ? 'Importing...' : 'Import'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Module: In-Play Management ─────────────────────
function InPlayManagement() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('startTime', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setMatches(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="smooth-transition">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>In-Play Management</h1>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Manage Markets & Odds in Real-Time</div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                {/* Match Selection Column */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '12px' }}>IMPORTED GAMES</div>
                    <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
                        {loading && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Syncing with Firestore...</div>}
                        {!loading && matches.length === 0 && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>No matches imported yet</div>}
                        {matches.map(m => (
                            <div
                                key={m.id}
                                onClick={() => setSelectedMatch(m)}
                                style={{
                                    padding: '16px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                    background: selectedMatch?.id === m.id ? 'var(--bg-body)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{m.name}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{m.status.toUpperCase()} • {new Date(m.startTime?.seconds * 1000).toLocaleTimeString()}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market & Odds Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {!selectedMatch ? (
                        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', opacity: 0.5, fontStyle: 'italic' }}>
                            Select a match to manage markets and odds
                        </div>
                    ) : (
                        <MarketsAndOddsView matchId={selectedMatch.id} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-component for Markets and Odds
function MarketsAndOddsView({ matchId }: { matchId: string }) {
    const [markets, setMarkets] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'matches', matchId, 'markets'), (mSnap) => {
            setMarkets(mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [matchId]);

    const handleAddMarket = async (type: string) => {
        try {
            const marketId = `${type}_${Date.now()}`;
            const marketRef = doc(db, 'matches', matchId, 'markets', marketId);
            await updateDoc(marketRef, {
                id: marketId,
                type: type,
                status: 'open',
                createdAt: serverTimestamp()
            });
            // Note: In a real app, you'd also create default selections here
        } catch (err) {
            console.error('Add market failed');
        }
    };

    return (
        <>
            <div className="card" style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', width: '100%', marginBottom: '8px' }}>QUICK ADD MARKET</span>
                <button onClick={() => handleAddMarket('toss')} style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Toss</button>
                <button onClick={() => handleAddMarket('session')} style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Session</button>
                <button onClick={() => handleAddMarket('fancy')} style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Fancy</button>
            </div>

            {markets.map(market => (
                <div key={market.id} className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market</span>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--accent)' }}>{market.type.toUpperCase()}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                                value={market.status}
                                onChange={async (e) => await updateDoc(doc(db, 'matches', matchId, 'markets', market.id), { status: e.target.value })}
                                style={{
                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                                    background: market.status === 'open' ? '#22c55e' : market.status === 'suspended' ? '#ef4444' : '#64748b',
                                    color: 'white', fontWeight: 800, fontSize: '10px', cursor: 'pointer'
                                }}
                            >
                                <option value="open">OPEN</option>
                                <option value="suspended">SUSPENDED</option>
                                <option value="closed">CLOSED</option>
                            </select>
                        </div>
                    </div>

                    <SelectionsList matchId={matchId} marketId={market.id} />
                </div>
            ))}
        </>
    );
}

function SelectionsList({ matchId, marketId }: { matchId: string, marketId: string }) {
    const [selections, setSelections] = useState<any[]>([]);
    const { updateOddDebounced, updating } = useAdminOdds();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'matches', matchId, 'markets', marketId, 'selections'), (sSnap) => {
            setSelections(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [matchId, marketId]);

    const handleDelta = (id: string, name: string, current: number, delta: number) => {
        const next = Number((current + delta).toFixed(2));
        updateOddDebounced(matchId, marketId, id, next);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {selections.map(selection => (
                <div key={selection.id} style={{
                    padding: '20px', borderRadius: '12px', background: 'var(--bg-body)', border: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', gap: '16px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 900, fontSize: '14px' }}>{selection.name}</span>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selection.status === 'active' ? '#22c55e' : '#ef4444' }}></div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={() => handleDelta(selection.id, selection.name, selection.odd, -0.01)}
                            style={{ width: '44px', height: '44px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontWeight: 900, fontSize: '18px', cursor: 'pointer' }}
                        >
                            -
                        </button>

                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 950, color: updating === selection.id ? 'var(--accent)' : 'inherit', transition: 'all 0.2s', transform: updating === selection.id ? 'scale(1.1)' : 'scale(1)' }}>
                                {selection.odd?.toFixed(2) || '0.00'}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>ODD PRICE</div>
                        </div>

                        <button
                            onClick={() => handleDelta(selection.id, selection.name, selection.odd, 0.01)}
                            style={{ width: '44px', height: '44px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontWeight: 900, fontSize: '18px', cursor: 'pointer' }}
                        >
                            +
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="number"
                            step="0.01"
                            value={selection.odd}
                            onChange={(e) => updateOddDebounced(matchId, marketId, selection.id, Number(e.target.value))}
                            style={{
                                padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                                fontSize: '13px', fontWeight: 800, textAlign: 'center', width: '100%', boxSizing: 'border-box'
                            }}
                        />
                        <button
                            onClick={async () => await updateDoc(doc(db, 'matches', matchId, 'markets', marketId, 'selections', selection.id), { status: selection.status === 'active' ? 'suspended' : 'active' })}
                            style={{
                                padding: '10px', borderRadius: '8px', border: '1px solid var(--border)',
                                background: selection.status === 'active' ? 'transparent' : '#ef4444',
                                color: selection.status === 'active' ? 'var(--text-secondary)' : 'white',
                                fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                            }}
                        >
                            {selection.status === 'active' ? 'SUS' : 'ACT'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main Dashboard Page ────────────────────────────
export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeModule, setActiveModule] = useState('in_play');

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/admin/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <AuthGuard>
            <div style={{ display: 'flex', background: 'var(--bg-body)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative' }}>
                <AdminSidebar
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                    collapsed={sidebarCollapsed}
                />

                <main style={{ flex: 1, minWidth: 0, padding: '32px 40px' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800 }}>{user.email.split('@')[0].toUpperCase()}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Administrator</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '16px' }}>
                                {user.email[0].toUpperCase()}
                            </div>
                        </div>
                    </header>

                    <div className="module-content">
                        {activeModule === 'live_discover' && <LiveMatchDiscover />}
                        {activeModule === 'in_play' && <InPlayManagement />}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
