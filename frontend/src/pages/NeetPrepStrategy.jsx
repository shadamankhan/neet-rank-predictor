
import React, { useEffect } from 'react';
import "./Home.css"; // Reusing Home.css for consistent styling

const NeetPrepStrategy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section" style={{ paddingBottom: '40px' }}>
                <h1 className="hero-title">
                    NEET Preparation Strategy
                </h1>
                <p className="hero-subtitle">
                    "Success in NEET is not about IQ. It is about Strategy, Consistency, and Emotional Management."
                </p>
            </section>

            {/* Navigation Tabs (Visual only for now, or just scroll links) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '0 20px 40px', flexWrap: 'wrap' }}>
                <a href="#first-timers" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>For First-Timers</a>
                <a href="#droppers" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>For Droppers</a>
                <a href="#low-scores" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>Stuck at Low Scores?</a>
            </div>

            <div className="section-container" style={{ paddingTop: '0' }}>

                {/* Section 1: First-Time Aspirants */}
                <section id="first-timers" style={{ marginBottom: '80px' }}>
                    <h2 className="section-title" style={{ textAlign: 'left', borderLeft: '5px solid var(--primary-color)', paddingLeft: '20px' }}>
                        1. For First-Time Aspirants (Class 11/12)
                    </h2>
                    <div className="feature-card" style={{ background: 'white', maxWidth: '100%' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                            The biggest challenge is <strong>Balancing Boards with NEET</strong>. Do not ignore your school exams, but treat NCERT as your bible for both.
                        </p>
                        <ul className="about-beliefs">
                            <li><strong>NCERT is God:</strong> 90% of Biology and Chemistry comes directly from NCERT lines. Read it at least 10 times.</li>
                            <li><strong>Don't skip Class 11:</strong> Most students waste Class 11 and panic in Class 12. If your 11th is weak, spend weekends fixing it.</li>
                            <li><strong>Mock Tests:</strong> Start giving full syllabus mock tests 3 months before the exam. Don't wait to "finish" portions.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 2: Droppers */}
                <section id="droppers" style={{ marginBottom: '80px' }}>
                    <h2 className="section-title" style={{ textAlign: 'left', borderLeft: '5px solid var(--accent-color)', paddingLeft: '20px' }}>
                        2. For Droppers
                    </h2>
                    <div className="feature-card" style={{ background: 'white', maxWidth: '100%' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                            You have the advantage of time, but the disadvantage of pressure. Your enemy is <strong>Burnout and Overconfidence</strong>.
                        </p>
                        <ul className="about-beliefs">
                            <li><strong>Analyze Failure:</strong> Why did you not succeed last time? Was it Physics numericals? Organic Chemistry? Lack of revision? Fix THAT specific problem first.</li>
                            <li><strong>New Material vs Old Material:</strong> Do not buy 10 new books. Re-solve the same good books you used earlier, but this time with a timer.</li>
                            <li><strong>Consistency:</strong> Studying 12 hours for one day and 0 hours for the next 3 days is useless. Study 7 hours EVERY day.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 3: Low Scores */}
                <section id="low-scores">
                    <h2 className="section-title" style={{ textAlign: 'left', borderLeft: '5px solid var(--secondary-color)', paddingLeft: '20px' }}>
                        3. Stuck at Low Scores (300-450)?
                    </h2>
                    <div className="feature-card" style={{ background: 'white', maxWidth: '100%' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                            If you are stuck in this range, you are likely making <strong>Conceptual Errors</strong> or <strong>Negative Marking</strong> mistakes.
                        </p>
                        <ul className="about-beliefs">
                            <li><strong>Stop Negative Marking:</strong> If you are not 100% sure, DO NOT attempt the question. It's better to get 0 than -1.</li>
                            <li><strong>Focus on High Weightage Chapters:</strong> Modern Physics, Genetics, Human Physiology, Electrostatics. Master these first.</li>
                            <li><strong>The 50-Question Rule:</strong> Solve 50 MCQs daily of your WEAKEST subject. Do this for 21 days and see the magic.</li>
                        </ul>
                    </div>
                </section>

            </div>

            <section className="strategy-section">
                <h2 className="section-title" style={{ color: 'white' }}>Final Advice from Shad Sir</h2>
                <p style={{ fontSize: '1.2rem', marginTop: '20px' }}>
                    "Discipline weighs ounces, regret weighs tons. Start today."
                </p>
            </section>

        </div>
    );
};

export default NeetPrepStrategy;
