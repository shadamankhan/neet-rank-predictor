import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

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
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden pb-10">
            <SEO
                title="NEET Rank & College Predictor 2026 | MBBS Cutoff & Counselling"
                description="Predict your NEET 2026 rank, MBBS college chances, and cutoff trends using real counselling data — trusted by students & parents."
            />
            {/* Hero Section */}
            <section className="text-center pt-32 pb-20 px-4 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.1)_0%,transparent_60%)] flex flex-col items-center">
                <div className="bg-red-50 text-red-500 px-5 py-2 rounded-full text-sm font-bold mb-8 inline-block shadow-sm">
                    Neet Counselling Made Honest 🔴
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight text-slate-900">
                    NEET Rank & College<br />
                    <span className="bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">Predictor 2026.</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
                    Predict your NEET 2026 rank, MBBS college chances, and cutoff trends using real counselling data — trusted by students & parents.
                </p>

                <div className="flex gap-4 flex-wrap justify-center">
                    <button
                        onClick={() => navigate('/neet-rank-predictor')}
                        className="px-8 py-4 rounded-full font-bold text-lg transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl bg-slate-900 text-white"
                    >
                        🎯 NEET Rank & College Predictor 2026
                    </button>
                    <button
                        onClick={() => navigate('/neet-counselling-roadmap')}
                        className="px-8 py-4 rounded-full font-bold text-lg transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-md bg-white text-slate-900 border border-slate-200"
                    >
                        👨‍👩‍👧 Parent Counselling Mode
                    </button>
                </div>
            </section>

            {/* What We Solve Section */}
            <section className="max-w-7xl mx-auto px-5 py-20 bg-white border-y border-slate-100">
                <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Why Students & Parents Fail?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-slate-50 p-8 rounded-2xl transition-all duration-200 hover:-translate-y-2 hover:bg-white hover:shadow-xl hover:border-red-100 border border-transparent group">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6 bg-red-100 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            ❌
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Confusion</h3>
                        <p className="text-slate-600 leading-relaxed">Not knowing what college is realistically possible after result.</p>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-slate-50 p-8 rounded-2xl transition-all duration-200 hover:-translate-y-2 hover:bg-white hover:shadow-xl hover:border-red-100 border border-transparent group">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6 bg-red-100 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            📉
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Wrong Choices</h3>
                        <p className="text-slate-600 leading-relaxed">Filling choices randomly and losing a good seat.</p>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-slate-50 p-8 rounded-2xl transition-all duration-200 hover:-translate-y-2 hover:bg-white hover:shadow-xl hover:border-red-100 border border-transparent group">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6 bg-red-100 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            💰
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Hidden Fees</h3>
                        <p className="text-slate-600 leading-relaxed">Getting shocked by hidden charges and bond penalties later.</p>
                    </div>
                </div>
            </section>

            {/* Roadmap Teaser */}
            <section className="max-w-6xl mx-auto px-5 py-20">
                <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Your NEET Journey — Step by Step</h2>
                <div className="flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto gap-8 mb-12">
                    {[
                        { num: 1, title: "Form Filling", date: "Dec-Jan" },
                        { num: 2, title: "Result & Rank", date: "June" },
                        { num: 3, title: "Counselling", date: "June-July" },
                        { num: 4, title: "Admission", date: "Aug-Sept" },
                    ].map((step, i) => (
                        <React.Fragment key={i}>
                            <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center flex-1 w-full md:w-auto shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                                    {step.num}
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-slate-900">{step.title}</h3>
                                <p className="text-sm text-slate-500 font-medium">{step.date}</p>
                            </div>
                            {i < 3 && <div className="text-slate-300 text-3xl hidden md:block">➜</div>}
                        </React.Fragment>
                    ))}
                </div>
                <div className="text-center">
                    <Link to="/roadmap" className="inline-block px-8 py-3 border-2 border-slate-900 text-slate-900 rounded-full font-bold transition-all hover:bg-slate-900 hover:text-white">
                        View Full Roadmap →
                    </Link>
                </div>
            </section>

            {/* Trust Section */}
            <section className="bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-5">
                    <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Why Trust Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "No False Hope", desc: "We tell you clearly if government seat is NOT possible." },
                            { title: "Rank-Based Logic", desc: "Prediction based on pure data, not guesswork." },
                            { title: "Parent Transparency", desc: "We explain total budget and risks clearly to parents." },
                            { title: "No Agent Pressure", desc: "We don't sell seats. We guide you to get merit seats." },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">✔</span>
                                <div>
                                    <h4 className="font-bold mb-2 text-slate-900">{item.title}</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Access States */}
            <section className="max-w-6xl mx-auto px-5 py-20">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Explore State Cutoffs</h2>
                    <Link to="/college-finder" className="text-blue-600 font-bold hover:underline">View All Colleges →</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                    {quickStates.map((state, idx) => (
                        <Link to={state.path} key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:border-blue-500 hover:-translate-y-1 hover:shadow-lg group">
                            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{state.emoji}</span>
                            <span className="font-semibold text-center text-sm text-slate-700 group-hover:text-blue-600">{state.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Premium Services / About */}
            <section className="bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-5 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="flex flex-col gap-6 items-start">
                        <span className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">Mentorship</span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">Honest Guidance</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            "Aapke bachche ka 2026 rank decide karega ki MBBS possible hai ya nahi.
                            Hum aapko seedha bataate hain: Government possible hai ya nahi, Private ka total kharcha,
                            aur kahin admission lene ka risk to nahi."
                        </p>
                        <div className="flex gap-4">
                            <Link to="/mentorship" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                Book Counselling
                            </Link>
                        </div>
                    </div>
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                        <h3 className="text-2xl font-bold mb-2 text-slate-900 relative z-10">Hi, I’m Shad Aman Khan 👋</h3>
                        <p className="text-blue-600 font-bold mb-6 text-sm relative z-10">Educator & NEET Mentor</p>
                        <p className="text-slate-600 leading-relaxed mb-6 relative z-10">
                            "I created this platform to ensure students don't fall for fake promises.
                            My data is raw, real, and directly from official sources."
                        </p>
                        <a href="https://youtube.com/@ShadAmanKhan" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-red-500 font-bold hover:text-red-600 relative z-10">
                            <span>📺</span> Watch on YouTube
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer is handled by global Layout/App, but leaving simple bottom strip if needed */}
        </div>
    );
};

export default Home;
