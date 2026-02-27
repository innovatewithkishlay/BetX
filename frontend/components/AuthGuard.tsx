'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            // Determine if we should redirect to Admin or Agent login
            if (pathname.startsWith('/admin')) {
                router.replace('/admin/login');
            } else {
                router.replace('/agent/login');
            }
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.025em' }}>Verifying session…</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
}
