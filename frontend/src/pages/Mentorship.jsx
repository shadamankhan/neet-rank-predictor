import React from 'react';
import './Mentorship.css';

const Mentorship = () => {
    return (
        <div className="mentorship-container">
            {/* 1. Header/Intro (UrbanPro Bio style) */}
            <section className="mentor-hero">
                <div className="mentor-content">
                    <h1>Shad Aman Khan</h1>
                    <h2>Physics & Chemistry Tutor | NEET Counsellor</h2>
                    <p className="mentor-tagline">
                        Classes 9–12 | Home Tuition | Honest Guidance
                    </p>
                    <p className="mentor-bio">
                        I am a Physics & Chemistry teacher and NEET counselling mentor, teaching students from Class 9 to 12
                        with a strong focus on concept clarity, numericals, and exam-oriented preparation.
                        My teaching approach is simple, logical, and tailored to each student’s level.
                        Along with teaching, I guide NEET aspirants and parents to make safe, informed admission decisions
                        without falling into coaching or counselling traps.
                    </p>
                    <div className="mentor-details">
                        <span>📍 Location: Mumbai</span>
                        <a href="https://maps.app.goo.gl/YHxdL9LUfmBPKRmm7?g_st=aw" target="_blank" rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '0.9em', border: '1px solid var(--primary-color)', padding: '2px 8px', borderRadius: '4px', marginLeft: '5px' }}>
                            View on Map ↗
                        </a>
                        <span style={{ marginLeft: '10px' }}>📘 Mode: Home Tuition / One-to-One Guidance</span>
                    </div>
                </div>
            </section>

            {/* 2. Why Learn With Me */}
            <section className="section-container light-bg">
                <h2 className="section-title">🧠 Why Learn Physics & Chemistry With Me?</h2>
                <div className="features-grid three-col">
                    <div className="feature-card">
                        <h3>Concepts</h3>
                        <p>Explained from basics to advanced application.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Numericals</h3>
                        <p>Focus on solving with logic & clarity.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Aligned</h3>
                        <p>Board + NEET aligned teaching strategy.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Personal</h3>
                        <p>Personal attention, no batch pressure.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Support</h3>
                        <p>Regular doubt solving sessions.</p>
                    </div>
                </div>
            </section>

            {/* 3. Subjects Offered */}
            <section className="section-container">
                <h2 className="section-title">🧪 Subjects Offered</h2>
                <div className="subjects-grid">
                    <div className="subject-card physics">
                        <h3>Physics</h3>
                        <ul>
                            <li>Mechanics</li>
                            <li>Thermodynamics</li>
                            <li>Electrostatics</li>
                            <li>Modern Physics</li>
                        </ul>
                        <p>Numerical solving with logic & clarity.</p>
                    </div>
                    <div className="subject-card chemistry">
                        <h3>Chemistry</h3>
                        <ul>
                            <li>Physical</li>
                            <li>Organic</li>
                            <li>Inorganic</li>
                        </ul>
                        <p>Concept + reaction understanding (not memorization).</p>
                    </div>
                </div>
            </section>

            {/* 4. NEET Counselling Guidance */}
            <section className="section-container light-bg">
                <h2 className="section-title">🎯 NEET Counselling Guidance</h2>
                <div className="guidance-list">
                    <div className="guidance-item">✔ Rank vs College Possibility</div>
                    <div className="guidance-item">✔ MBBS / BDS / Private / Deemed options</div>
                    <div className="guidance-item">✔ Drop vs admission clarity</div>
                    <div className="guidance-item">✔ Fee comparison & risk explanation</div>
                    <div className="guidance-item">✔ Parent-friendly sessions</div>
                    <div className="guidance-item highlight">No false hope. Only reality.</div>
                </div>
            </section>

            {/* 5. Parent-Focused Mentorship */}
            <section className="section-container">
                <h2 className="section-title">👨‍👩‍👦 Parent-Focused Mentorship</h2>
                <div className="parent-grid">
                    <div className="feature-card">
                        <h3>Clear Communication</h3>
                        <p>Transparent updates on student progress.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Financial Safety</h3>
                        <p>Awareness about hidden costs and fees.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Honest Planning</h3>
                        <p>Academic planning based on reality.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Student-Centric</h3>
                        <p>Guidance tailored to the child's needs.</p>
                    </div>
                </div>
            </section>

            {/* 6. Contact / Call to Action */}
            <section className="cta-section-large">
                <h2>📞 Get Started</h2>
                <div className="cta-options">
                    <div className="cta-box">
                        <h3>📘 Home Tuition</h3>
                        <p>Physics & Chemistry (Class 9-12)</p>
                    </div>
                    <div className="cta-box">
                        <h3>🩺 NEET Counselling</h3>
                        <p>1-to-1 Personal Guidance Session</p>
                    </div>
                </div>
                <div className="cta-buttons">
                    <button className="btn-primary" onClick={() => window.open('https://wa.me/91XXXXXXXXXX?text=Hi, I want to book a session', '_blank')}>
                        Enquire on WhatsApp
                    </button>
                    {/* Add booking link if available */}
                </div>

                <div className="closing-statement">
                    <p>“Strong concepts build strong ranks.</p>
                    <p>Correct guidance builds safe futures.”</p>
                </div>
            </section>
        </div>
    );
};

export default Mentorship;
