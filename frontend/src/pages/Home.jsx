import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
    const [score, setScore] = useState('');
    const navigate = useNavigate();

    const handlePredict = () => {
        if (score) {
            navigate('/predict', { state: { score } });
        } else {
            navigate('/predict');
        }
    };

    const quickStates = [
        { name: "Karnataka", path: "/karnataka-private", emoji: "🏰" },
        { name: "Kerala", path: "/kerala-private", emoji: "🌴" },
        { name: "UP Private", path: "/up-private", emoji: "🕌" },
        { name: "Bihar", path: "/bihar-private", emoji: "🚩" },
        { name: "Deemed Univ", path: "/deemed-explorer", emoji: "🎓" },
        { name: "West Bengal", path: "/west-bengal-private", emoji: "🐅" },
    ];

    return (
        <div className="home-container">
            <SEO
                title="NEET Rank Predictor 2026 - Data-Backed & Honest"
                description="Predict your NEET 2026 All India Rank based on real historical data. Honest analysis, no false hopes. Plan your NEET 2026 journey today."
            />
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-badge">Neet Counselling Made Honest 🔴</div>
                <h1 className="hero-title">
                    Know Your Reality For<br />
                    <span className="gradient-text">NEET 2026.</span>
                </h1>
                <p className="hero-subtitle">
                    From NEET exam form filling to final MBBS admission — we guide students & parents at every counselling step with clarity, data, and honesty.
                </p>

                <div className="hero-buttons">
                    <button onClick={() => navigate('/predict')} className="btn-hero btn-primary-hero">
                        🎯 Predict NEET 2026 Rank
                    </button>
                    <button onClick={() => navigate('/roadmap')} className="btn-hero btn-secondary-hero">
                        👨‍👩‍👦 Parent Guidance Mode
                    </button>
                </div>
            </section>

            {/* What We Solve Section */}
            <section className="section-container bg-offset">
                <h2 className="section-title">Why Students & Parents Fail?</h2>
                <div className="features-grid">
                    <div className="feature-card red-hover">
                        <div className="icon-box icon-red">❌</div>
                        <h3>Confusion</h3>
                        <p>Not knowing what college is realistically possible after result.</p>
                    </div>
                    <div className="feature-card red-hover">
                        <div className="icon-box icon-red">📉</div>
                        <h3>Wrong Choices</h3>
                        <p>Filling choices randomly and losing a good seat.</p>
                    </div>
                    <div className="feature-card red-hover">
                        <div className="icon-box icon-red">💰</div>
                        <h3>Hidden Fees</h3>
                        <p>Getting shocked by hidden charges and bond penalties later.</p>
                    </div>
                </div>
            </section>

            {/* Roadmap Teaser */}
            <section className="section-container">
                <h2 className="section-title">Your NEET Journey — Step by Step</h2>
                <div className="roadmap-teaser">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h3>Form Filling</h3>
                        <p>Dec-Jan</p>
                    </div>
                    <div className="step-arrow">➜</div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h3>Result & Rank</h3>
                        <p>June</p>
                    </div>
                    <div className="step-arrow">➜</div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h3>Counselling</h3>
                        <p>June-July</p>
                    </div>
                    <div className="step-arrow">➜</div>
                    <div className="step-card">
                        <div className="step-number">4</div>
                        <h3>Admission</h3>
                        <p>Aug-Sept</p>
                    </div>
                </div>
                <div className="center-btn">
                    <Link to="/roadmap" className="btn-outline-large">View Full Roadmap →</Link>
                </div>
            </section>

            {/* Trust Section */}
            <section className="section-container bg-offset">
                <h2 className="section-title">Why Trust Us?</h2>
                <div className="trust-grid">
                    <div className="trust-item">
                        <span className="check-icon">✔</span>
                        <div>
                            <h4>No False Hope</h4>
                            <p>We tell you clearly if government seat is NOT possible.</p>
                        </div>
                    </div>
                    <div className="trust-item">
                        <span className="check-icon">✔</span>
                        <div>
                            <h4>Rank-Based Logic</h4>
                            <p>Prediction based on pure data, not guesswork.</p>
                        </div>
                    </div>
                    <div className="trust-item">
                        <span className="check-icon">✔</span>
                        <div>
                            <h4>Parent Transparency</h4>
                            <p>We explain total budget and risks clearly to parents.</p>
                        </div>
                    </div>
                    <div className="trust-item">
                        <span className="check-icon">✔</span>
                        <div>
                            <h4>No Agent Pressure</h4>
                            <p>We don't sell seats. We guide you to get merit seats.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Access States */}
            <section className="section-container">
                <div className="section-header-row">
                    <h2 className="section-title-left">Explore State Cutoffs</h2>
                    <Link to="/college-finder" className="link-view-all">View All Colleges →</Link>
                </div>
                <div className="quick-states-grid">
                    {quickStates.map((state, idx) => (
                        <Link to={state.path} key={idx} className="state-card">
                            <span className="state-emoji">{state.emoji}</span>
                            <span className="state-name">{state.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Premium Services / About */}
            <section className="section-container bg-offset">
                <div className="info-split">
                    <div className="info-text">
                        <span className="tag-pill">Mentorship</span>
                        <h2>Honest Guidance</h2>
                        <p>
                            "Aapke bachche ka 2026 rank decide karega ki MBBS possible hai ya nahi.
                            Hum aapko seedha bataate hain: Government possible hai ya nahi, Private ka total kharcha,
                            aur kahin admission lene ka risk to nahi."
                        </p>
                        <div className="btn-group">
                            <Link to="/mentorship" className="btn-primary">Book Counselling</Link>
                        </div>
                    </div>
                    <div className="info-card">
                        <h3>Hi, I’m Shad Aman Khan 👋</h3>
                        <p className="role-text">Educator & NEET Mentor</p>
                        <p>
                            "I created this platform to ensure students don't fall for fake promises.
                            My data is raw, real, and directly from official sources."
                        </p>
                        <a href="https://youtube.com/@ShadAmanKhan" target="_blank" rel="noopener noreferrer" className="youtube-link">
                            📺 Watch on YouTube
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer-modern">
                <div className="footer-content">
                    <div className="footer-brand">NEET Predictor</div>
                    <p>© 2025 Shad Aman Khan. All rights reserved.</p>
                    <p className="disclaimer">Disclaimer: Predictions are estimates based on historical data.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
