'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/axios';

// ─── Types ───────────────────────────────────────────

interface AgentProfile {
    uid: string;
    email: string;
    role: string;
    status: string;
    agentLimit?: number;
    createdAt?: string;
    lastLogin?: string;
}

interface Client {
    id: string;
    code: string;
    name: string;
    mobile: string;
    password: string;
    clientLimit: number;
    status: 'active' | 'inactive';
}

// ─── Icons (Minimalist SVGs) ─────────────────────────

const Icons = {
    Master: () => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7a2 2 0 012-2h12a2 2 0 012 2M4 7l8 5 8-5M12 11v4m-2-2h4" /></svg>
    ),
    Games: () => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    Casino: () => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    ),
    Plus: () => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>
    ),
    Search: () => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
    ),
    User: () => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
    Edit: () => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
    ),
    Logout: () => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
    ),
    Moon: () => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
    ),
    Sun: () => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
    )
};

// ─── Dashboard Sidebar ───────────────────────────────
function Sidebar({ activeModule, setActiveModule, collapsed, onClose }: { activeModule: string, setActiveModule: (m: string) => void, collapsed: boolean, onClose?: () => void }) {
    const sections = [
        {
            title: 'MASTER DETAILS',
            items: [
                { id: 'collection_master', label: 'Collection Master', icon: <Icons.Master /> },
                { id: 'client_master', label: 'Client Master', icon: <Icons.Master /> },
            ]
        },
        {
            title: 'GAMES',
            items: [
                { id: 'in_play', label: 'InPlay Game', icon: <Icons.Games /> },
                { id: 'complete_game', label: 'Complete Game', icon: <Icons.Games /> },
            ]
        },
        {
            title: 'CASINO',
            items: [
                { id: 'live_casino', label: 'Live Casino Position', icon: <Icons.Casino /> },
                { id: 'casino_details', label: 'Casino Details', icon: <Icons.Casino /> },
            ]
        }
    ];

    return (
        <aside className="dashboard-sidebar" style={{
            width: collapsed ? '80px' : '260px',
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '4px 0 12px rgba(0,0,0,0.02)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{ padding: collapsed ? '24px 0' : '24px 32px', borderBottom: '1px solid var(--border)', textAlign: 'center', overflow: 'hidden' }}>
                <span
                    onClick={() => setActiveModule('client_master')}
                    style={{
                        fontWeight: 900,
                        fontSize: collapsed ? '16px' : '18px',
                        color: 'var(--accent)',
                        letterSpacing: '-0.04em',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {collapsed ? 'BX' : 'BetX'}
                </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '24px 8px' : '24px 16px', overflowX: 'hidden' }}>
                {sections.map((section) => (
                    <div key={section.title} style={{ marginBottom: '28px' }}>
                        {!collapsed && <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '16px' }}>{section.title}</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveModule(item.id); onClose?.(); }}
                                    title={collapsed ? item.label : ''}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        gap: collapsed ? '0' : '12px',
                                        padding: collapsed ? '12px 0' : '10px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: activeModule === item.id ? 'var(--accent)' : 'transparent',
                                        color: activeModule === item.id ? 'white' : 'var(--text-secondary)',
                                        fontSize: '13px',
                                        fontWeight: activeModule === item.id ? 700 : 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        textAlign: 'left',
                                        width: '100%'
                                    }}
                                >
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

// ─── Client Master View ──────────────────────────────

function ClientMasterView({ profile }: { profile: AgentProfile | null }) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Modal Control
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({ name: '', mobile: '', password: '', clientLimit: '' });

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/agent/clients');
            if (res.data.success) setClients(res.data.data);
        } catch (err) {
            console.error('Fetch clients failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const generatePassword = () => {
        const nums = Math.floor(1000 + Math.random() * 9000).toString();
        const chars = Math.random().toString(36).substring(2, 6); // 4 random alpha chars
        setForm(p => ({ ...p, password: `${nums}${chars}` }));
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setEditingClientId(null);
        setForm({ name: '', mobile: '', password: '', clientLimit: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (client: Client) => {
        setModalMode('edit');
        setEditingClientId(client.id);
        setForm({
            name: client.name,
            mobile: client.mobile,
            password: client.password,
            clientLimit: client.clientLimit.toString()
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...form, clientLimit: Number(form.clientLimit) || 0 };
            if (modalMode === 'create') {
                const res = await api.post('/api/agent/clients', payload);
                if (res.data.success) {
                    await fetchClients();
                    setShowModal(false);
                }
            } else {
                const res = await api.put(`/api/agent/clients/${editingClientId}`, payload);
                if (res.data.success) {
                    await fetchClients();
                    setShowModal(false);
                }
            }
        } catch (err) {
            alert('Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleClientStatus = async (client: Client) => {
        const newStatus = client.status === 'active' ? 'inactive' : 'active';
        try {
            const res = await api.put(`/api/agent/clients/${client.id}`, { status: newStatus });
            if (res.data.success) {
                setClients(p => p.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
            }
        } catch (err) {
            console.error('Update status failed');
        }
    };

    const filteredClients = clients.filter(c => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.mobile.includes(searchTerm);
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="smooth-transition">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.04em' }}>Client Master</h1>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Home / Client</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={handleOpenCreate} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer'
                    }}>
                        <Icons.Plus /> New
                    </button>
                    <button onClick={() => setFilterStatus('active')} style={{ padding: '10px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>All Active</button>
                    <button onClick={() => setFilterStatus('inactive')} style={{ padding: '10px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>All Deactive</button>
                </div>
            </header>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Show <select style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}><option>50</option></select> entries
                </div>
                <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}><Icons.Search /></span>
                    <input
                        type="text"
                        placeholder="Search by Name, Code, or Mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '10px 40px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="dashboard-table-wrapper" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(148, 163, 184, 0.05)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            {['#', 'CODE', 'NAME', 'MOBILE', 'PASSWORD', 'LIMIT', 'STATUS', 'ACTION'].map((h, i) => (
                                <th key={h} style={{
                                    padding: '16px 20px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: 'var(--text-muted)',
                                    letterSpacing: '0.05em',
                                    borderRight: i < 7 ? '1px solid var(--border)' : 'none'
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Synching data...</td></tr>
                        ) : filteredClients.length === 0 ? (
                            <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No clients found.</td></tr>
                        ) : filteredClients.map((client, idx) => (
                            <tr key={client.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, borderRight: '1px solid var(--border)' }}>{idx + 1}</td>
                                <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)', borderRight: '1px solid var(--border)' }}>{client.code}</td>
                                <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 500, borderRight: '1px solid var(--border)' }}>{client.name}</td>
                                <td style={{ padding: '16px 20px', fontSize: '13px', borderRight: '1px solid var(--border)' }}>{client.mobile}</td>
                                <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>{client.password}</td>
                                <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, borderRight: '1px solid var(--border)' }}>{client.clientLimit}</td>
                                <td style={{ padding: '16px 20px', borderRight: '1px solid var(--border)' }}>
                                    <button
                                        onClick={() => toggleClientStatus(client)}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, border: 'none', cursor: 'pointer',
                                            background: client.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: client.status === 'active' ? '#22c55e' : '#ef4444',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {client.status}
                                    </button>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <button
                                        onClick={() => handleOpenEdit(client)}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.8 }}
                                        title="Edit Client"
                                    >
                                        <Icons.Edit />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Client Modal (Create / Edit) */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'var(--bg-card)', width: '420px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s' }}>
                        <div style={{ background: '#3b82f6', padding: '16px 24px', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                            <span style={{ fontWeight: 800 }}>{modalMode === 'create' ? 'Add New Client' : 'Update Client Details'}</span>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Client Name</label>
                                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} placeholder="Enter name" />
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Minimum 3 letters required *</p>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={{ flex: 1, height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} placeholder="Auto-gen or type" />
                                    <button type="button" onClick={generatePassword} style={{ padding: '0 12px', background: '#06b6d4', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>Generate Password</button>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Contact No</label>
                                <input required value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} placeholder="Mobile No" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Client Limit</label>
                                    <input
                                        type="text"
                                        value={form.clientLimit}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                setForm(p => ({ ...p, clientLimit: val }));
                                            }
                                        }}
                                        style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(148,163,184,0.05)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>My Limit</label>
                                    <input disabled value={profile?.agentLimit || '0.00'} style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(148,163,184,0.05)', color: 'var(--text-muted)', outline: 'none', cursor: 'not-allowed', fontSize: '13px' }} />
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} style={{ height: '45px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '12px', fontSize: '13px' }}>
                                {submitting ? (modalMode === 'create' ? 'Creating...' : 'Updating...') : (modalMode === 'create' ? 'Create Client' : 'Update Client')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Agent Profile View ──────────────────────────────

function AgentProfileView({ profile }: { profile: AgentProfile | null }) {
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
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.04em' }}>Agent Profile</h1>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Account / Security</div>
            </header>

            <div style={{ maxWidth: '600px' }}>
                <section className="profile-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--card-shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(45deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 800 }}>👤</div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{profile.email}</h2>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile.role}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Agent Identifier</span>
                            <span style={valueStyle}>{profile.uid}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Account Status</span>
                            <span style={{ ...valueStyle, color: '#22c55e', textTransform: 'uppercase' }}>{profile.status}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Authorization Level</span>
                            <span style={valueStyle}>Scoped Agent Access</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Member Since</span>
                            <span style={valueStyle}>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active User'}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Last Active Session</span>
                            <span style={valueStyle}>{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Just now'}</span>
                        </div>
                    </div>

                    <button style={{ marginTop: '32px', width: '100%', height: '42px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'not-allowed' }}>
                        Edit Profile (Restricted)
                    </button>
                </section>

                <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center', fontWeight: 600 }}>
                    Profile modifications are managed by the System Administrator.
                </p>
            </div>
        </div>
    );
}

// ─── Main Content Wrapper ────────────────────────────

function DashboardContent() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [activeModule, setActiveModule] = useState('client_master');
    const [showDropdown, setShowDropdown] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/api/agent/profile');
                if (res.data.success) setProfile(res.data.data);
            } catch (err: any) {
                console.error('Profile fetch failed');
            }
        };
        fetchProfile();
    }, []);

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
        router.replace('/agent/login');
    };

    const handleModuleSwitch = (mod: string) => {
        setActiveModule(mod);
        setShowDropdown(false);
        setMobileSidebarOpen(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', display: 'flex' }}>

            {/* Mobile Overlay */}
            {mobileSidebarOpen && (
                <div
                    onClick={() => setMobileSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 39,
                    }}
                />
            )}

            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="desktop-sidebar">
                <Sidebar activeModule={activeModule} setActiveModule={handleModuleSwitch} collapsed={sidebarCollapsed} />
            </div>

            {/* Mobile Sidebar Drawer */}
            <div className="mobile-sidebar-drawer" style={{
                transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'fixed', top: 0, left: 0, height: '100vh',
                zIndex: 50,
            }}>
                <Sidebar activeModule={activeModule} setActiveModule={handleModuleSwitch} collapsed={false} onClose={() => setMobileSidebarOpen(false)} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: 0 /* Allow flex child to shrink */ }}>
                {/* Custom animations + Mobile styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .desktop-sidebar { display: flex; }
                    .mobile-sidebar-drawer { display: none; }
                    .mobile-only { display: none !important; }
                    .hide-mobile { display: flex; }
                    @media (max-width: 768px) {
                        .desktop-sidebar { display: none !important; }
                        .mobile-sidebar-drawer { display: block !important; }
                        .mobile-only { display: flex !important; }
                        .hide-mobile { display: none !important; }
                        .dashboard-table-wrapper { 
                            overflow-x: auto; 
                            -webkit-overflow-scrolling: touch; 
                            margin: 0 -16px; 
                            padding: 0 16px;
                            width: calc(100% + 32px);
                            box-sizing: border-box;
                        }
                        .dashboard-main-padding { padding: 20px 16px !important; }
                        .dashboard-nav-padding { padding: 0 16px !important; }
                        .profile-card { padding: 20px !important; }
                        .smooth-transition header { margin-bottom: 24px !important; }
                    }
                ` }} />

                {/* SaaS Nav (Compact) */}
                <nav style={{
                    height: '60px',
                    padding: '0 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--nav-bg)',
                    borderBottom: '1px solid var(--border)',
                    backdropFilter: 'blur(12px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Desktop collapse toggle */}
                        <button
                            className="hide-mobile"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '8px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        {/* Mobile hamburger */}
                        <button
                            className="mobile-only"
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '8px', cursor: 'pointer', borderRadius: '8px', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        {/* Mobile Logo */}
                        <span className="mobile-only" style={{ fontWeight: 900, fontSize: '18px', color: 'var(--accent)', letterSpacing: '-0.04em', alignItems: 'center' }}>BetX</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="profile-container" style={{ position: 'relative' }}>
                            <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                            >
                                <div style={{ opacity: activeModule === 'profile' || showDropdown ? 1 : 0.7 }}>
                                    <p style={{ fontSize: '11px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>{profile?.role || 'AGENT'}</p>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Online</p>
                                </div>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: activeModule === 'profile' || showDropdown ? 'var(--accent)' : 'linear-gradient(45deg, #3b82f6, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800,
                                    boxShadow: showDropdown ? '0 0 0 2px var(--bg), 0 0 0 4px var(--accent)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>👤</div>
                            </div>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0, width: '220px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                    zIndex: 100, overflow: 'hidden', animation: 'fadeInScale 0.2s ease-out'
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{profile?.email}</p>
                                        <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', margin: '2px 0 0', textTransform: 'uppercase' }}>Active Session</p>
                                    </div>

                                    <div style={{ padding: '8px' }}>
                                        <button
                                            onClick={() => handleModuleSwitch('profile')}
                                            style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px', textAlign: 'left', transition: 'background 0.2s' }}
                                        >
                                            <Icons.User /> View Profile
                                        </button>
                                        <button
                                            onClick={() => handleModuleSwitch('client_master')}
                                            style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px', textAlign: 'left', transition: 'background 0.2s' }}
                                        >
                                            <Icons.Master /> Client Master
                                        </button>

                                        <div style={{ margin: '4px 0', height: '1px', background: 'var(--border)' }} />

                                        <button
                                            onClick={toggleTheme}
                                            style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px', textAlign: 'left', transition: 'background 0.2s' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
                                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                            </div>
                                            <span style={{ fontSize: '10px', opacity: 0.5 }}>{theme === 'dark' ? '🌞' : '🌙'}</span>
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '6px', textAlign: 'left', transition: 'background 0.2s' }}
                                        >
                                            <Icons.Logout /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                <main className="dashboard-main-padding" style={{ flex: 1, padding: '40px 32px' }}>
                    {activeModule === 'client_master' && <ClientMasterView profile={profile} />}
                    {activeModule === 'profile' && <AgentProfileView profile={profile} />}
                    {['collection_master', 'in_play', 'complete_game', 'live_casino', 'casino_details'].includes(activeModule) && (
                        <div style={{
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            border: '1px solid var(--border)',
                            padding: '48px 24px',
                            textAlign: 'center',
                            boxShadow: 'var(--card-shadow)',
                            animation: 'fadeIn 0.4s ease',
                        }}>
                            {/* Icon */}
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px',
                            }}>
                                <svg width="28" height="28" fill="none" stroke="var(--accent)" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" strokeLinecap="round" />
                                </svg>
                            </div>

                            {/* Badge */}
                            <div style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '20px',
                                marginBottom: '16px',
                            }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Coming Soon
                                </span>
                            </div>

                            {/* Module Name */}
                            <h2 style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                margin: '0 0 10px',
                                letterSpacing: '-0.03em',
                                textTransform: 'capitalize',
                            }}>
                                {activeModule.replace(/_/g, ' ')}
                            </h2>

                            {/* Description */}
                            <p style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                maxWidth: '340px',
                                lineHeight: 1.7,
                                margin: '0 0 28px',
                                fontWeight: 500,
                            }}>
                                This module is currently under development and will be available in a future release. Stay tuned for updates.
                            </p>

                            {/* Divider */}
                            <div style={{
                                width: '40px',
                                height: '2px',
                                background: 'var(--accent)',
                                borderRadius: '4px',
                                opacity: 0.4,
                            }} />
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer style={{
                    borderTop: '1px solid var(--border)',
                    padding: '14px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--nav-bg)',
                    backdropFilter: 'blur(12px)',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, margin: 0 }}>
                        Copyright © 2025 <span style={{ color: 'var(--accent)', fontWeight: 700 }}>agent.betx.com</span>. All rights reserved.
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, margin: 0 }}>
                        Version <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>1.0.0</span>
                    </p>
                </footer>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}
