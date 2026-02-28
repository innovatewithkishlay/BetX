import React from 'react';

export const Icons = {
    Master: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7a2 2 0 012-2h12a2 2 0 012 2M4 7l8 5 8-5M12 11v4m-2-2h4" /></svg>
    ),
    Games: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    Casino: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    ),
    Plus: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" {...props}><path d="M12 5v14m-7-7h14" /></svg>
    ),
    Search: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
    ),
    User: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
    Edit: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
    ),
    Logout: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
    ),
    Moon: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
    ),
    Sun: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
    ),
    Import: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 3v11m0 0l-4-4m4 4l4-4" /></svg>
    ),
    Refresh: (props: React.SVGAttributes<SVGElement>) => (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M4 4v5h5M20 20v-5h-5M20 9A9 9 0 005.64 5.64L4 9m16 6l-1.64 3.36A9 9 0 014 15" /></svg>
    )
};
