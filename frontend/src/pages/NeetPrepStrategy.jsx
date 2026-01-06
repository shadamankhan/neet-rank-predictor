
import React, { useEffect } from 'react';

const NeetPrepStrategy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-10">
            {/* Hero Section */}
            <section className="text-center pt-12 pb-10 px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                    NEET Preparation Strategy
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto italic leading-relaxed">
                    "Success in NEET is not about IQ. It is about Strategy, Consistency, and Emotional Management."
                </p>
            </section>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap justify-center gap-4 px-5 pb-10">
                <a href="#first-timers" className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all text-sm md:text-base">For First-Timers</a>
                <a href="#droppers" className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all text-sm md:text-base">For Droppers</a>
                <a href="#low-scores" className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all text-sm md:text-base">Stuck at Low Scores?</a>
            </div>

            <div className="max-w-4xl mx-auto px-5 space-y-20">

                {/* Section 1: First-Time Aspirants */}
                <section id="first-timers" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">
                        1. For First-Time Aspirants (Class 11/12)
                    </h2>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                            The biggest challenge is <strong>Balancing Boards with NEET</strong>. Do not ignore your school exams, but treat NCERT as your bible for both.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-blue-600 shrink-0">NCERT is God:</span>
                                <div>90% of Biology and Chemistry comes directly from NCERT lines. Read it at least 10 times.</div>
                            </li>
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-blue-600 shrink-0">Don't skip Class 11:</span>
                                <div>Most students waste Class 11 and panic in Class 12. If your 11th is weak, spend weekends fixing it.</div>
                            </li>
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-blue-600 shrink-0">Mock Tests:</span>
                                <div>Start giving full syllabus mock tests 3 months before the exam. Don't wait to "finish" portions.</div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 2: Droppers */}
                <section id="droppers" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-purple-600 pl-4">
                        2. For Droppers
                    </h2>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                            You have the advantage of time, but the disadvantage of pressure. Your enemy is <strong>Burnout and Overconfidence</strong>.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-purple-600 shrink-0">Analyze Failure:</span>
                                <div>Why did you not succeed last time? Was it Physics numericals? Organic Chemistry? Lack of revision? Fix THAT specific problem first.</div>
                            </li>
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-purple-600 shrink-0">New Material vs Old Material:</span>
                                <div>Do not buy 10 new books. Re-solve the same good books you used earlier, but this time with a timer.</div>
                            </li>
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-purple-600 shrink-0">Consistency:</span>
                                <div>Studying 12 hours for one day and 0 hours for the next 3 days is useless. Study 7 hours EVERY day.</div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 3: Low Scores */}
                <section id="low-scores" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-emerald-600 pl-4">
                        3. Stuck at Low Scores (300-450)?
                    </h2>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                            If you are stuck in this range, you are likely making <strong>Conceptual Errors</strong> or <strong>Negative Marking</strong> mistakes.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-emerald-600 shrink-0">Stop Negative Marking:</span>
                                <div>If you are not 100% sure, DO NOT attempt the question. It's better to get 0 than -1.</div>
                            </li>
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-emerald-600 shrink-0">Focus on High Weightage Chapters:</span>
                                <div>Modern Physics, Genetics, Human Physiology, Electrostatics. Master these first.</div>
                            </li>
                            <li className="flex gap-3 text-slate-700">
                                <span className="font-bold text-emerald-600 shrink-0">The 50-Question Rule:</span>
                                <div>Solve 50 MCQs daily of your WEAKEST subject. Do this for 21 days and see the magic.</div>
                            </li>
                        </ul>
                    </div>
                </section>

            </div>

            <section className="mt-20 py-16 bg-slate-900 text-center px-4">
                <h2 className="text-3xl font-bold text-white mb-6">Final Advice from Shad Sir</h2>
                <p className="text-xl text-slate-300 italic">
                    "Discipline weighs ounces, regret weighs tons. Start today."
                </p>
            </section>

        </div>
    );
};

export default NeetPrepStrategy;
