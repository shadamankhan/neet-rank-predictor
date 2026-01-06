import React from 'react';

const LegalLayout = ({ title, lastUpdated, children }) => {
    const styles = {
        container: {
            maxWidth: '800px',
            margin: '40px auto',
            padding: '40px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            fontFamily: '"Inter", sans-serif',
            color: '#333',
        },
        header: {
            borderBottom: '1px solid #eee',
            paddingBottom: '20px',
            marginBottom: '30px',
            textAlign: 'center',
        },
        title: {
            fontSize: '2.5rem',
            color: '#0a192f',
            fontWeight: '700',
            marginBottom: '10px',
        },
        meta: {
            color: '#666',
            fontSize: '0.9rem',
        },
        content: {
            lineHeight: '1.8',
            fontSize: '1rem',
        }
    };

    return (
        <div style={{ minHeight: '80vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>{title}</h1>
                    {lastUpdated && <p style={styles.meta}>Last Updated: {lastUpdated}</p>}
                </div>
                <div style={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default LegalLayout;
