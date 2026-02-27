'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPlaceholder() {
    const { user, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/admin/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'var(--font-inter), sans-serif'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                background: 'var(--bg-card)',
                padding: '48px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                textAlign: 'center',
                boxShadow: 'var(--card-shadow)'
            }}>
                <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '20px',
                    marginBottom: '24px'
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Secure</span>
                </div>

                <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.04em' }}>Welcome, Admin</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
                    The Admin Dashboard module is currently under construction. Authentication has been successfully established and your session is secure.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            padding: '12px 24px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Toggle Theme
                    </button>
                    <button
                        onClick={async () => {
                            await logout();
                            router.replace('/admin/login');
                        }}
                        style={{
                            padding: '12px 24px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
