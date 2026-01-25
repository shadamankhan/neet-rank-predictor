import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <section className="hero" style={{ textAlign: 'center', padding: '4rem 0' }}>
                <h1 style={{ fontSize: '3rem', color: 'var(--amu-primary)', marginBottom: '1rem' }}>
                    Crack AMU Class 11 Entrance
                </h1>
                <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#666' }}>
                    Master Class 9 & 10 Syllabus | AI-Powered Analysis | Real Exam-Like Mock Tests
                </p>
                <button onClick={() => navigate('/login')} className="btn-primary" style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
                    Start Free Hack Test
                </button>
            </section>

            <section className="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ color: 'var(--amu-primary)' }}>AMU Pattern Only</h3>
                    <p>Questions strictly based on AMU Entrance trend. No irrelevant board-level theory.</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--amu-primary)' }}>AI Performance Analysis</h3>
                    <p>Identify your weak chapters from Class 9 & 10 instantly after every test.</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--amu-primary)' }}>Rank Predictor</h3>
                    <p>Know where you stand among thousands of AMU aspirants.</p>
                </div>
            </section>
        </div>
    );
}
