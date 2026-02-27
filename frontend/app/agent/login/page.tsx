'use client';

import { useState, FormEvent, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/lib/axios';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('betx_remember_email');
        if (saved) setForm((p) => ({ ...p, email: saved, rememberMe: true }));
    }, []);

    useEffect(() => {
        if (!authLoading && user) router.replace('/agent/dashboard');
    }, [user, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
        setErrors((p: any) => ({ ...p, [name]: undefined, general: undefined }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setErrors({
                email: !form.email ? 'Email required' : undefined,
                password: !form.password ? 'Password required' : undefined
            });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await setPersistence(auth, form.rememberMe ? browserLocalPersistence : browserSessionPersistence);
            await signInWithEmailAndPassword(auth, form.email, form.password);
            const res = await api.post('/api/agent/auth/verify');

            if (res.data.success) {
                if (form.rememberMe) localStorage.setItem('betx_remember_email', form.email);
                else localStorage.removeItem('betx_remember_email');
                router.push('/agent/dashboard');
            } else {
                setErrors({ general: 'Access denied. Authorized agents only.' });
                await auth.signOut();
            }
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.message?.includes('API key')) {
                setErrors({ general: 'System Offline: Firebase config missing.' });
            } else if (err.code === 'auth/invalid-credential') {
                setErrors({ general: 'Invalid email or password' });
            } else {
                setErrors({ general: 'Unable to sign in. Please try again later.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;

    const boxStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '360px',
        padding: '36px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '8px',
        letterSpacing: '-0.01em'
    };

    const inputStyle = (name: string): React.CSSProperties => ({
        width: '100%',
        height: '42px',
        padding: '0 14px',
        background: 'var(--bg-input)',
        border: '1px solid',
        borderColor: focusedField === name ? 'var(--accent)' : 'var(--border-input)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        boxShadow: focusedField === name ? '0 0 0 2px rgba(99, 102, 241, 0.1)' : 'none'
    });

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            padding: '24px',
            boxSizing: 'border-box'
        }}>

            {/* Mini Toggle (SaaS Minimal) */}
            <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '8px',
                    transition: 'color 0.2s ease'
                }}
            >
                {theme === 'dark' ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                )}
            </button>

            <div style={boxStyle}>
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '6px',
                        marginBottom: '12px'
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Agent Access Only</span>
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.025em' }}>BetX Agent Portal</h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>Sign in to manage your agent account</p>
                </div>

                {errors.general && (
                    <div style={{
                        padding: '12px',
                        background: 'var(--error-bg)',
                        border: '1px solid var(--error-border)',
                        borderRadius: '8px',
                        color: 'var(--error-text)',
                        fontSize: '13px',
                        marginBottom: '24px',
                        lineHeight: 1.4
                    }}>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="agent@betx.com"
                            value={form.email}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            disabled={loading}
                            style={{ ...inputStyle('email'), borderColor: errors.email ? 'var(--error-border)' : (focusedField === 'email' ? 'var(--accent)' : 'var(--border-input)') }}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                disabled={loading}
                                style={{ ...inputStyle('password'), paddingRight: '44px', borderColor: errors.password ? 'var(--error-border)' : (focusedField === 'password' ? 'var(--accent)' : 'var(--border-input)') }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? (
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                ) : (
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={form.rememberMe}
                                onChange={handleChange}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Remember me</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            height: '42px',
                            background: 'var(--accent)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.8 : 1,
                            marginTop: '4px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In as Agent'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-faint)', marginTop: '32px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Secure Agent Terminal v2.1
                </p>
            </div>
        </div>
    );
}
