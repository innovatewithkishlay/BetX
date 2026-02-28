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
interface AdminProfile {
    uid: string;
    email: string;
    role: string;
    status: string;
    createdAt?: string;
    lastLogin?: string;
}

// ─── Sidebar Component ──────────────────────────────
function AdminSidebar({ activeModule, setActiveModule, collapsed, isOpen, toggleSidebar, userRole }: {
    activeModule: string,
    setActiveModule: (m: string) => void,
    collapsed: boolean,
    isOpen: boolean,
    toggleSidebar: () => void,
    userRole: string
}) {
    const sections = [
        {
            title: 'MATCH MANAGEMENT',
            items: [
                { id: 'live_discover', label: 'Match Discovery', icon: <Icons.Search /> },
                { id: 'manual_add', label: 'Manual Add', icon: <Icons.Plus /> },
                { id: 'in_play', label: 'In-Play Management', icon: <Icons.Games /> },
            ]
        },
        {
            title: 'SYSTEM MANAGEMENT',
            roles: ['admin'],
            items: [
                { id: 'agents', label: 'Agent Management', icon: <Icons.User /> },
                { id: 'clients', label: 'Client Management', icon: <Icons.User /> },
                { id: 'sub_admins', label: 'Sub-Admin Management', icon: <Icons.Plus /> },
            ]
        }
    ];

    const filteredSections = sections.filter(s => !s.roles || s.roles.includes(userRole));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}

            <aside className={`dashboard-sidebar ${isOpen ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}>
                <div style={{ padding: collapsed ? '20px 0' : '20px 24px', borderBottom: '1px solid var(--border)', textAlign: 'center', overflow: 'hidden' }}>
                    <span onClick={() => { setActiveModule('in_play'); if (isOpen) toggleSidebar(); }} style={{
                        fontWeight: 900, fontSize: collapsed ? '14px' : '16px', color: 'var(--accent)', letterSpacing: '-0.04em', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                        {collapsed ? 'BX' : 'BetX Admin'}
                    </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '24px 8px' : '24px 16px', overflowX: 'hidden' }}>
                    {filteredSections.map((section) => (
                        <div key={section.title} style={{ marginBottom: '24px' }}>
                            {!collapsed && <p style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '10px', paddingLeft: '16px' }}>{section.title}</p>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {section.items.map((item) => (
                                    <button key={item.id} onClick={() => { setActiveModule(item.id); if (isOpen) toggleSidebar(); }} title={collapsed ? item.label : ''} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: collapsed ? '0' : '12px',
                                        padding: collapsed ? '12px 0' : '10px 16px', borderRadius: '8px', border: 'none',
                                        background: activeModule === item.id ? 'var(--accent)' : 'transparent',
                                        color: activeModule === item.id ? 'white' : 'var(--text-secondary)',
                                        fontSize: '12px', fontWeight: activeModule === item.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%'
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
        </>
    );
}

// ─── Module: Live Match Discovery ─────────────────────
function LiveMatchDiscover() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');

    const fetchMatches = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/api/admin/cricket/matches');
            if (res.data.success) {
                setMatches(res.data.data);
            } else {
                setError(res.data.message || 'Failed to fetch matches from server');
            }
        } catch (err: any) {
            console.error('Fetch live matches failed');
            setError(err.code === 'ECONNABORTED' ? 'Request timed out. The server or API is too slow.' : 'Network error or server is down.');
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

    // Sophisticated match categorization logic
    const categorized = {
        all: matches,
        live: matches.filter(m => m.matchStarted && !m.matchEnded),
        finished: matches.filter(m => m.matchEnded || (m.status && (m.status.toLowerCase().includes('won by') || m.status.toLowerCase().includes('tied') || m.status.toLowerCase().includes('drawn') || m.status.toLowerCase().includes('result')))),
        upcoming: matches.filter(m => !m.matchStarted && !m.matchEnded)
    };

    const currentMatches = categorized[activeTab];

    return (
        <div className="smooth-transition">
            <header className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Match Discovery</h1>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Categorized Live Games from API</div>
                </div>
                <button onClick={fetchMatches} className="btn-mobile-full" title="Sync with API" style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                }}>
                    <Icons.Refresh /> Refresh
                </button>
            </header>

            <div className="category-tabs">
                <button onClick={() => setActiveTab('all')} className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}>
                    All <span style={{ marginLeft: '4px', opacity: 0.7 }}>({categorized.all.length})</span>
                </button>
                <button onClick={() => setActiveTab('live')} className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}>
                    Live {categorized.live.length > 0 && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({categorized.live.length})</span>}
                </button>
                <button onClick={() => setActiveTab('upcoming')} className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}>
                    Upcoming {categorized.upcoming.length > 0 && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({categorized.upcoming.length})</span>}
                </button>
                <button onClick={() => setActiveTab('finished')} className={`tab-btn ${activeTab === 'finished' ? 'active' : ''}`}>
                    Finished {categorized.finished.length > 0 && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({categorized.finished.length})</span>}
                </button>
            </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="match-card" style={{ opacity: 0.3, height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="spinner"></div>
                        </div>
                    ))
                ) : error ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>{error}</p>
                        <button onClick={fetchMatches} style={{ marginTop: '20px', padding: '10px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Try Again</button>
                    </div>
                ) : currentMatches.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No {activeTab} matches found at the moment.</p>
                    </div>
                ) : (
                    currentMatches.map((m) => {
                        const isLive = m.matchStarted && !m.matchEnded;
                        const isFinished = m.matchEnded || (m.status && (m.status.toLowerCase().includes('won by') || m.status.toLowerCase().includes('tied') || m.status.toLowerCase().includes('drawn') || m.status.toLowerCase().includes('result')));
                        const isUpcoming = !m.matchStarted && !m.matchEnded && !isFinished;

                        return (
                            <div key={m.id} className="match-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        {isLive ? (
                                            <div className="live-pulse">LIVE</div>
                                        ) : isFinished ? (
                                            <div className="result-badge">FINISHED</div>
                                        ) : (
                                            <div className="upcoming-badge">UPCOMING</div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'white', lineHeight: '1.3', margin: 0, letterSpacing: '-0.01em' }}>
                                        {m.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isFinished ? '#22c55e' : 'var(--accent)' }}></div>
                                        <p style={{ fontSize: '11px', color: isFinished ? '#22c55e' : 'var(--text-secondary)', fontWeight: 700, margin: 0 }}>
                                            {isFinished ? m.status : `Starts ${new Date(m.startTime).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>

                                {!isFinished && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
                                        <button
                                            disabled={importing === m.id}
                                            onClick={() => handleImport(m)}
                                            style={{
                                                flex: 1, padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px',
                                                fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', position: 'relative',
                                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                            }}
                                        >
                                            {importing === m.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>
                                                    Importing
                                                </div>
                                            ) : 'Quick Import'}
                                        </button>
                                        <button className="smooth-transition" style={{
                                            padding: '12px', background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                                            borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Icons.Refresh style={{ width: '16px', height: '16px' }} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Module: Manual Match Add ────────────────────────
function ManualMatchAdd({ onCreated }: { onCreated: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        teamA: '',
        teamB: '',
        startTime: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/admin/cricket/manual-create', formData);
            if (res.data.success) {
                setSuccess(res.data.matchId);
                setFormData({ name: '', teamA: '', teamB: '', startTime: '' });
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create match');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="smooth-transition card" style={{ maxWidth: '600px', padding: '48px', textAlign: 'center' }}>
                <div style={{ color: '#22c55e', marginBottom: '16px' }}>
                    <Icons.Plus style={{ width: '48px', height: '48px' }} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Match Created!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>
                    Match has been successfully added to In-Play Management.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        onClick={() => { setSuccess(null); }}
                        style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Create Another
                    </button>
                    <button
                        onClick={onCreated}
                        style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Manage Odds Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="smooth-transition" style={{ maxWidth: '600px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Manual Match Add</h1>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Create a new match manually</div>
            </header>

            <div className="card" style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>MATCH NAME</label>
                        <input
                            type="text"
                            placeholder="e.g. India vs Pakistan"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}
                        />
                    </div>

                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>TEAM A</label>
                            <input
                                type="text"
                                placeholder="Team A Name"
                                required
                                value={formData.teamA}
                                onChange={(e) => setFormData({ ...formData, teamA: e.target.value })}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>TEAM B</label>
                            <input
                                type="text"
                                placeholder="Team B Name"
                                required
                                value={formData.teamB}
                                onChange={(e) => setFormData({ ...formData, teamB: e.target.value })}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>START TIME</label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            style={{
                                padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                                background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px',
                                colorScheme: 'dark' // Ensures the native date picker is readable in dark mode
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '8px', padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', fontSize: '13px'
                        }}
                    >
                        {loading ? 'Creating...' : 'Create Match'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Module: Agent Management ────────────────────────
function AgentManagement() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/system/agents');
            if (res.data.success) setAgents(res.data.data);
        } catch (err) {
            console.error('Fetch agents failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAgents(); }, []);

    return (
        <div className="smooth-transition">
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Agent Management</h1>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Overview of all registered agents</div>
            </header>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-wrapper">
                    <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Agent</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Email</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                            ) : agents.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>No agents found</td></tr>
                            ) : (
                                agents.map((agent: any) => (
                                    <tr key={agent.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 20px', fontWeight: 700 }}>{agent.name || agent.displayName || 'Unnamed Agent'}</td>
                                        <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{agent.email}</td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <span style={{ padding: '3px 8px', borderRadius: '4px', background: agent.status === 'active' ? '#22c55e' : '#64748b', color: 'white', fontSize: '8px', fontWeight: 900 }}>{agent.status?.toUpperCase() || 'ACTIVE'}</span>
                                        </td>
                                        <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Module: Client Management ───────────────────────
function ClientManagement() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/system/clients');
            if (res.data.success) setClients(res.data.data);
        } catch (err) {
            console.error('Fetch clients failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, []);

    return (
        <div className="smooth-transition">
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Global Client List</h1>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>All clients managed by agents across the system</div>
            </header>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-wrapper">
                    <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Client Code</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Name</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Mobile</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Limit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>No clients found in system</td></tr>
                            ) : (
                                clients.map((client: any) => (
                                    <tr key={client.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 20px', fontWeight: 900, color: 'var(--accent)' }}>{client.code}</td>
                                        <td style={{ padding: '12px 20px', fontWeight: 700 }}>{client.name}</td>
                                        <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{client.mobile}</td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <span style={{ padding: '3px 8px', borderRadius: '4px', background: client.status === 'active' ? '#22c55e' : '#64748b', color: 'white', fontSize: '8px', fontWeight: 900 }}>{client.status?.toUpperCase()}</span>
                                        </td>
                                        <td style={{ padding: '12px 20px', fontWeight: 700 }}>{client.clientLimit}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Module: Sub-Admin Management ─────────────────────
function SubAdminManagement() {
    const [subAdmins, setSubAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [generatedCreds, setGeneratedCreds] = useState<any | null>(null);

    const fetchSubAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/system/subadmins');
            if (res.data.success) setSubAdmins(res.data.data);
        } catch (err) {
            console.error('Fetch sub-admins failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSubAdmins(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/api/admin/system/subadmin/create', formData);
            if (res.data.success) {
                setGeneratedCreds(res.data.data);
                setFormData({ name: '', email: '' });
                fetchSubAdmins();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create sub-admin');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="smooth-transition">
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Sub-Admin Management</h1>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Create and manage staff accounts</div>
            </header>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                {/* Create Form */}
                <div style={{ minWidth: 0 }}>
                    <div className="card" style={{ padding: '24px' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '20px' }}>CREATE NEW SUB-ADMIN</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>NAME</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>EMAIL</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                style={{
                                    marginTop: '8px', padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: creating ? 0.7 : 1, fontSize: '12px'
                                }}
                            >
                                {creating ? 'Generating Account...' : 'Generate Sub-Admin'}
                            </button>
                        </form>

                        {generatedCreds && (
                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '8px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e', margin: '0 0 12px 0' }}>SUCCESS! COPY CREDENTIALS:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                        <p style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-muted)', margin: 0 }}>EMAIL</p>
                                        <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{generatedCreds.email}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-muted)', margin: 0 }}>PASSWORD</p>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <code style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent)' }}>{generatedCreds.password}</code>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(generatedCreds.password)}
                                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                COPY
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setGeneratedCreds(null)}
                                        style={{ marginTop: '8px', padding: '6px', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        I've saved it
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* List Table */}
                <div style={{ minWidth: 0 }}>
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrapper">
                            <table style={{ minWidth: '500px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Sub-Admin</th>
                                        <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Email</th>
                                        <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', opacity: 0.3 }}>Syncing Accounts...</td></tr>
                                    ) : subAdmins.length === 0 ? (
                                        <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', opacity: 0.3 }}>No sub-admins found</td></tr>
                                    ) : (
                                        subAdmins.map((sub: any) => (
                                            <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px 20px', fontWeight: 700 }}>{sub.name}</td>
                                                <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{sub.email}</td>
                                                <td style={{ padding: '12px 20px' }}>
                                                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#22c55e', color: 'white', fontSize: '8px', fontWeight: 900 }}>ACTIVE</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Module: In-Play Management ─────────────────────
function InPlayManagement() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'finished'>('all');

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('startTime', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setMatches(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredMatches = matches.filter(m => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'live') return m.status === 'Live' || !m.status.toLowerCase().includes('won');
        if (activeFilter === 'finished') return m.status.toLowerCase().includes('won');
        return true;
    });

    return (
        <div className="smooth-transition">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>In-Play Management</h1>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Manage Markets & Odds in Real-Time</div>
            </header>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                {/* Match Selection Column */}
                <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '700px' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '12px', background: 'var(--bg-body)' }}>
                        MANAGED GAMES
                    </div>

                    {/* Tiny inline filter tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                        {['all', 'live', 'finished'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f as any)}
                                style={{
                                    flex: 1, padding: '10px', fontSize: '10px', fontWeight: 800, border: 'none', background: activeFilter === f ? 'var(--bg-body)' : 'transparent',
                                    color: activeFilter === f ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: activeFilter === f ? '2px solid var(--accent)' : 'none'
                                }}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {loading && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Syncing with Firestore...</div>}
                        {!loading && filteredMatches.length === 0 && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>No matches found</div>}
                        {filteredMatches.map(m => {
                            const isFinished = m.status?.toLowerCase().includes('won');
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMatch(m)}
                                    className="smooth-transition"
                                    style={{
                                        padding: '16px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                        background: selectedMatch?.id === m.id ? 'var(--bg-body)' : 'transparent',
                                        borderLeft: selectedMatch?.id === m.id ? '4px solid var(--accent)' : '4px solid transparent',
                                        opacity: isFinished ? 0.6 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{m.name}</div>
                                        {m.status === 'Live' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></div>}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        <span>{isFinished ? 'FINISHED' : 'IN-PLAY'}</span>
                                        <span>{new Date(m.startTime?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Market & Odds Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                    {!selectedMatch ? (
                        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', opacity: 0.5, fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <Icons.Games style={{ width: '40px', height: '40px' }} />
                                <span>Select a match from the left to manage markets and odds</span>
                            </div>
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
    const [addingSelection, setAddingSelection] = useState<string | null>(null);
    const [newSelection, setNewSelection] = useState({ name: '', odd: 1.90 });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'matches', matchId, 'markets'), (mSnap) => {
            setMarkets(mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [matchId]);

    const handleAddMarket = async (type: string) => {
        try {
            const res = await api.post('/api/admin/cricket/market/add', { matchId, type });
            if (res.data.success) {
                // Real-time listener handles the update
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Add market failed');
        }
    };

    const handleAddSelection = async (marketId: string) => {
        if (!newSelection.name) return;
        try {
            const res = await api.post('/api/admin/cricket/selection/add', {
                matchId,
                marketId,
                name: newSelection.name,
                initialOdd: newSelection.odd
            });
            if (res.data.success) {
                setAddingSelection(null);
                setNewSelection({ name: '', odd: 1.90 });
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Add selection failed');
        }
    };

    const handleSettle = async (marketId: string, winnerId: string) => {
        if (!window.confirm('Are you sure you want to settle this market? This action cannot be undone.')) return;
        try {
            const res = await api.post('/api/admin/cricket/market/settle', {
                matchId,
                marketId,
                winnerSelectionId: winnerId
            });
            if (res.data.success) {
                alert('Market settled successfully');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Settle failed');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return { bg: '#22c55e', label: 'OPEN' };
            case 'suspended': return { bg: '#eab308', label: 'SUSPENDED' };
            case 'closed': return { bg: '#ef4444', label: 'CLOSED' };
            default: return { bg: '#64748b', label: status.toUpperCase() };
        }
    };

    return (
        <>
            <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', width: '100%', marginBottom: '4px' }}>QUICK ADD MARKET</span>
                <button onClick={() => handleAddMarket('toss')} style={{ padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}>+ Toss</button>
                <button onClick={() => handleAddMarket('session')} style={{ padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}>+ Session</button>
                <button onClick={() => handleAddMarket('fancy')} style={{ padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}>+ Fancy</button>
                <button onClick={() => handleAddMarket('lambi')} style={{ padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}>+ Lambi</button>
            </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 1fr', gap: '16px' }}>
                {markets.map(market => {
                    const status = getStatusStyle(market.status);
                    return (
                        <div key={market.id} className="card" style={{ padding: '20px', position: 'relative', borderLeft: `3px solid ${status.bg}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <span style={{ fontSize: '8px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market</span>
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: 'var(--accent)' }}>{market.type.toUpperCase()}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: '20px', background: status.bg, color: 'white', fontSize: '9px', fontWeight: 900 }}>{status.label}</span>
                                    {market.status !== 'closed' && (
                                        <button
                                            onClick={() => setAddingSelection(addingSelection === market.id ? null : market.id)}
                                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: '9px', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            + Add Run
                                        </button>
                                    )}
                                </div>
                            </div>

                            {addingSelection === market.id && (
                                <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-body)', borderRadius: '8px', display: 'flex', gap: '12px' }}>
                                    <input
                                        placeholder="Outcome (e.g. 150 Runs)"
                                        value={newSelection.name}
                                        onChange={e => setNewSelection({ ...newSelection, name: e.target.value })}
                                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newSelection.odd}
                                        onChange={e => setNewSelection({ ...newSelection, odd: Number(e.target.value) })}
                                        style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}
                                    />
                                    <button
                                        onClick={() => handleAddSelection(market.id)}
                                        style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            <SelectionsList
                                matchId={matchId}
                                marketId={market.id}
                                marketStatus={market.status}
                                onSettle={(winnerId) => handleSettle(market.id, winnerId)}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
}

function SelectionsList({ matchId, marketId, marketStatus, onSettle }: { matchId: string, marketId: string, marketStatus: string, onSettle: (winnerId: string) => void }) {
    const [selections, setSelections] = useState<any[]>([]);
    const { updateOddDebounced, updating } = useAdminOdds();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'matches', matchId, 'markets', marketId, 'selections'), (sSnap) => {
            setSelections(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [matchId, marketId]);

    const handleDelta = (id: string, name: string, current: number, delta: number) => {
        if (marketStatus === 'closed') return;
        const next = Number((current + delta).toFixed(2));
        updateOddDebounced(matchId, marketId, id, next);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {selections.map(selection => (
                <div key={selection.id} style={{
                    padding: '16px', borderRadius: '12px', background: 'var(--bg-body)', border: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', gap: '12px', opacity: marketStatus === 'closed' ? 0.7 : 1,
                    position: 'relative', overflow: 'hidden'
                }}>
                    {selection.status === 'won' && <div style={{ position: 'absolute', top: 0, right: 0, background: '#22c55e', color: 'white', padding: '3px 10px', fontSize: '9px', fontWeight: 900 }}>WINNER</div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 900, fontSize: '12px' }}>{selection.name}</span>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: selection.status === 'active' || selection.status === 'won' ? '#22c55e' : '#ef4444' }}></div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            disabled={marketStatus === 'closed'}
                            onClick={() => handleDelta(selection.id, selection.name, selection.odd, -0.01)}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontWeight: 900, fontSize: '14px', cursor: marketStatus === 'closed' ? 'not-allowed' : 'pointer' }}
                        >
                            -
                        </button>

                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 950, color: updating === selection.id ? 'var(--accent)' : 'inherit', transition: 'all 0.2s', transform: updating === selection.id ? 'scale(1.1)' : 'scale(1)' }}>
                                {selection.odd?.toFixed(2) || '0.00'}
                            </div>
                            <div style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>ODD PRICE</div>
                        </div>

                        <button
                            disabled={marketStatus === 'closed'}
                            onClick={() => handleDelta(selection.id, selection.name, selection.odd, 0.01)}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontWeight: 900, fontSize: '14px', cursor: marketStatus === 'closed' ? 'not-allowed' : 'pointer' }}
                        >
                            +
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="number"
                            step="0.01"
                            disabled={marketStatus === 'closed'}
                            value={selection.odd}
                            onChange={(e) => updateOddDebounced(matchId, marketId, selection.id, Number(e.target.value))}
                            style={{
                                padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                                fontSize: '12px', fontWeight: 800, textAlign: 'center', width: '100%', boxSizing: 'border-box'
                            }}
                        />
                        {marketStatus !== 'closed' ? (
                            <button
                                onClick={() => onSettle(selection.id)}
                                style={{
                                    padding: '8px', borderRadius: '8px', background: 'var(--accent)', color: 'white',
                                    border: 'none', fontSize: '10px', fontWeight: 800, cursor: 'pointer'
                                }}
                            >
                                SETTLE
                            </button>
                        ) : (
                            <div style={{ padding: '8px', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>{selection.status.toUpperCase()}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Admin Profile View ──────────────────────────────
function AdminProfileView({ profile }: { profile: AdminProfile | null }) {
    if (!profile) return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Loading profile details...</div>;

    const detailRowStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: '1px solid var(--border)',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: 500
    };

    const valueStyle: React.CSSProperties = {
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--text-primary)'
    };

    return (
        <div className="smooth-transition">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Admin Profile</h1>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>System Governance / Identity</div>
            </header>

            <div style={{ maxWidth: '600px' }}>
                <section className="match-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 800 }}>👤</div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{profile.email}</h2>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile.role.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>User Identifier</span>
                            <span style={valueStyle}>{profile.uid}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Access Status</span>
                            <span style={{ ...valueStyle, color: '#22c55e', textTransform: 'uppercase' }}>{profile.status}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Creation Date</span>
                            <span style={valueStyle}>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active System Account'}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Recent Authorization</span>
                            <span style={valueStyle}>{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Just now'}</span>
                        </div>
                    </div>

                    <button disabled style={{ marginTop: '32px', width: '100%', height: '42px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'not-allowed', opacity: 0.5 }}>
                        Edit Master Profile (Restricted)
                    </button>
                </section>
            </div>
        </div>
    );
}

// ─── Main Dashboard Page ────────────────────────────
export default function AdminDashboard() {
    const { user, loading: authLoading, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeModule, setActiveModule] = useState('in_play');
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const allowedRoles = ['admin', 'subadmin'];
        if (!authLoading && (!user || !allowedRoles.includes(user.role || ''))) {
            router.push('/admin/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/api/admin/profile');
                if (res.data.success) setProfile(res.data.data);
            } catch (err) {
                console.error('Profile fetch failed');
            }
        };
        if (user) fetchProfile();
    }, [user]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (showDropdown && !target.closest('.profile-container')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [showDropdown]);

    const handleLogout = async () => {
        await logout();
        router.replace('/admin/login');
    };

    const handleModuleSwitch = (mod: string) => {
        setActiveModule(mod);
        setShowDropdown(false);
        setSidebarOpen(false);
    };

    if (authLoading || !user) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <AuthGuard>
            <div className="admin-layout-wrapper">
                <AdminSidebar
                    activeModule={activeModule}
                    setActiveModule={handleModuleSwitch}
                    collapsed={sidebarCollapsed}
                    isOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    userRole={profile?.role || user.role || 'subadmin'}
                />

                <main className="dashboard-main">
                    <header className="dashboard-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: '70px', background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="smooth-transition sidebar-toggle-btn"
                                style={{
                                    background: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)',
                                    display: 'flex', borderRadius: '8px', border: '1px solid var(--border)',
                                    zIndex: 50
                                }}
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
                            </button>
                            {/* Desktop Toggle */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="smooth-transition hide-mobile collapse-btn"
                                style={{
                                    background: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)',
                                    borderRadius: '8px', border: '1px solid var(--border)'
                                }}
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <div className="nav-breadcrumb hide-mobile" style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ opacity: 0.5 }}>Admin</span>
                                <span style={{ opacity: 0.3 }}>/</span>
                                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{activeModule.replace('_', ' ')}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="profile-container" style={{ position: 'relative' }}>
                                <div
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                >
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }} className="hide-mobile">
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>{profile?.role || user.role || 'ADMIN'}</p>
                                        <p style={{ margin: 0, fontSize: '10px', color: '#22c55e', fontWeight: 700 }}>Root Connected</p>
                                    </div>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        background: showDropdown ? 'var(--accent)' : 'linear-gradient(45deg, var(--accent), #6366f1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800,
                                        boxShadow: showDropdown ? '0 0 0 2px var(--bg), 0 0 0 4px var(--accent)' : 'none',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>👤</div>
                                </div>

                                {showDropdown && (
                                    <div className="profile-dropdown" style={{
                                        position: 'absolute', top: '120%', right: 0, width: '220px',
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                        zIndex: 100, overflow: 'hidden', animation: 'fadeInScale 0.2s ease-out'
                                    }}>
                                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'rgba(99, 102, 241, 0.05)' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.email || user.email}</p>
                                            <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', margin: '4px 0 0', textTransform: 'uppercase' }}>Administrator Account</p>
                                        </div>

                                        <div style={{ padding: '8px' }}>
                                            <button
                                                onClick={() => handleModuleSwitch('profile')}
                                                style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'background 0.2s' }}
                                            >
                                                <Icons.User style={{ width: '16px' }} /> View Profile
                                            </button>

                                            <div style={{ margin: '4px 0', height: '1px', background: 'var(--border)' }} />

                                            <button
                                                onClick={toggleTheme}
                                                style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'background 0.2s' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {theme === 'dark' ? <Icons.Sun style={{ width: '16px' }} /> : <Icons.Moon style={{ width: '16px' }} />}
                                                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                                </div>
                                                <span style={{ fontSize: '10px', opacity: 0.5 }}>{theme === 'dark' ? '🌞' : '🌙'}</span>
                                            </button>

                                            <button
                                                onClick={handleLogout}
                                                style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'background 0.2s' }}
                                            >
                                                <Icons.Logout style={{ width: '16px' }} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="module-content" style={{ padding: '32px' }}>
                        {activeModule === 'profile' && <AdminProfileView profile={profile} />}
                        {activeModule === 'live_discover' && <LiveMatchDiscover />}
                        {activeModule === 'manual_add' && <ManualMatchAdd onCreated={() => handleModuleSwitch('in_play')} />}
                        {activeModule === 'in_play' && <InPlayManagement />}
                        {activeModule === 'agents' && <AgentManagement />}
                        {activeModule === 'clients' && <ClientManagement />}
                        {activeModule === 'sub_admins' && <SubAdminManagement />}
                    </div>
                </main>

                <style jsx global>{`
                    .dashboard-root { min-height: 100vh; background: var(--bg); color: var(--text-primary); }
                    .dashboard-main { transition: margin-left 0.3s ease; min-height: 100vh; display: flex; flex-direction: column; flex: 1; }
                    .sidebar-toggle-btn { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 8px; }
                    .collapse-btn { background: none; border: none; color: var(--text-muted); padding: 8px; cursor: pointer; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                    .collapse-btn:hover { background: var(--bg-body); color: var(--accent); }
                    
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    @media (max-width: 768px) {
                        .dashboard-main { margin-left: 0 !important; }
                        .sidebar-toggle-btn { display: block; }
                        .collapse-btn { display: none; }
                        .hide-mobile { display: none; }
                        .dashboard-nav { padding: 0 16px !important; }
                        .module-container { padding: 20px 16px !important; }
                    }
                `}</style>
            </div>
        </AuthGuard >
    );
}
