'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function NotFound() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-inter), sans-serif',
            position: 'relative',
        }}>
            {/* Theme Toggle */}
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

            {/* Glow Background Effect */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
            }} />

            {/* Card */}
            <div style={{
                textAlign: 'center',
                maxWidth: '440px',
                width: '100%',
                animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
            }}>
                {/* Badge */}
                <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '20px',
                    marginBottom: '24px',
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        BetX Agent Portal
                    </span>
                </div>

                {/* 404 Number */}
                <div style={{
                    fontSize: '96px',
                    fontWeight: 900,
                    color: 'var(--accent)',
                    lineHeight: 1,
                    letterSpacing: '-0.05em',
                    marginBottom: '16px',
                    opacity: 0.9,
                }}>
                    404
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 12px',
                    letterSpacing: '-0.02em',
                }}>
                    Page Not Found
                </h1>

                {/* Description */}
                <p style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    margin: '0 0 32px',
                    fontWeight: 500,
                }}>
                    The page you are looking for doesn&apos;t exist or has been moved. Please check the URL or navigate back to the dashboard.
                </p>

                {/* Divider */}
                <div style={{
                    width: '40px',
                    height: '2px',
                    background: 'var(--accent)',
                    borderRadius: '2px',
                    margin: '0 auto 32px',
                    opacity: 0.5,
                }} />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/agent/dashboard" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 22px',
                        background: 'var(--accent)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 700,
                        borderRadius: '8px',
                        textDecoration: 'none',
                        transition: 'opacity 0.2s ease',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                        letterSpacing: '-0.01em',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Go to Dashboard
                    </Link>
                    <Link href="/agent/login" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 22px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        textDecoration: 'none',
                        border: '1px solid var(--border)',
                        transition: 'all 0.2s ease',
                        letterSpacing: '-0.01em',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                        Back to Login
                    </Link>
                </div>

                {/* Footer Note */}
                <p style={{
                    marginTop: '40px',
                    fontSize: '11px',
                    color: 'var(--text-faint)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    Secure Agent Terminal v2.1
                </p>
            </div>
        </div>
    );
}
