import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemePanel({ onClose }) {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'classic', label: '🩺 Classic Medical', desc: 'Recommended for first-time users' },
        { id: 'night', label: '🌙 Night Study', desc: 'Best for late-night preparation' },
        { id: 'parent', label: '👨‍👩‍👦 Parent Friendly', desc: 'Simplified view for parents' },
        { id: 'focus', label: '🎯 Focus Mode', desc: 'Minimal & distraction-free' }
    ];

    return (
        <div style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 1000,
            width: '320px',
            color: 'var(--text-primary)'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                🎨 Choose Your Experience
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Pick a theme that feels comfortable for you.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {themes.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id, true)}
                        style={{
                            background: theme === t.id ? 'var(--primary)' : 'transparent',
                            color: theme === t.id ? '#fff' : 'var(--text-primary)',
                            border: `1px solid ${theme === t.id ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '12px',
                            padding: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{t.label}</span>
                        <span style={{
                            fontSize: '0.8rem',
                            opacity: theme === t.id ? 0.9 : 0.7,
                            fontWeight: 'normal'
                        }}>
                            {t.desc}
                        </span>
                    </button>
                ))}
            </div>

            {onClose && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        textDecoration: 'underline'
                    }}>Close</button>
                </div>
            )}
        </div>
    );
}
