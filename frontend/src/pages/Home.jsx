import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
    const [score, setScore] = useState('');
    const navigate = useNavigate();

    const handlePredict = () => {
        if (score) {
            navigate('/neet-rank-predictor', { state: { score } });
        } else {
            navigate('/neet-rank-predictor');
        }
    };

    const quickStates = [
        { name: "Karnataka", path: "/karnataka-private-medical-colleges", emoji: "🏰" },
        { name: "Kerala", path: "/kerala-private-medical-colleges", emoji: "🌴" },
        { name: "UP Private", path: "/up-private-medical-colleges", emoji: "🕌" },
        { name: "Bihar", path: "/bihar-private-medical-colleges", emoji: "🚩" },
        { name: "Deemed Univ", path: "/deemed-medical-colleges", emoji: "🎓" },
        { name: "West Bengal", path: "/west-bengal-private-medical-colleges", emoji: "🐅" },
    ];

    return (
        <div className="home-container">
            <SEO
                title="NEET Rank & College Predictor 2026 | MBBS Cutoff & Counselling"
                description="Predict your NEET 2026 rank, MBBS college chances, and cutoff trends using real counselling data — trusted by students & parents."
            />
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-badge">Neet Counselling Made Honest 🔴</div>
                <h1 className="hero-title">
                    NEET Rank & College<br />
                    <span className="gradient-text">Predictor 2026.</span>
                </h1>
                <p className="hero-subtitle">
                    Predict your NEET 2026 rank, MBBS college chances, and cutoff trends using real counselling data — trusted by students & parents.
                </p>

                <div className="hero-buttons">
                    <button onClick={() => navigate('/neet-rank-predictor')} className="btn-hero btn-primary-hero">
                        🎯 NEET Rank & College Predictor 2026
                    </button>
                    <button onClick={() => navigate('/neet-counselling-roadmap')} className="btn-hero btn-secondary-hero">
                        👨‍👩‍👧 Parent Counselling Mode
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
