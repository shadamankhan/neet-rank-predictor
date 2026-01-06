import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 py-16 font-sans">
            <div className="max-w-7xl mx-auto px-6">

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

                    {/* Column 1: Brand & Purpose */}
                    <div className="flex flex-col">
                        <div className="text-2xl font-bold text-white mb-6">
                            My NEET College Predictor
                        </div>
                        <p className="text-sm leading-relaxed mb-4 text-gray-400">
                            <strong>Smart NEET Rank & College Prediction Platform</strong>
                        </p>
                        <p className="text-sm leading-relaxed text-gray-400">
                            My NEET College Predictor helps NEET aspirants analyze ranks, predict MBBS colleges, understand cutoffs, and plan counselling using previous years’ MCC & State data.
                        </p>
                    </div>

                    {/* Column 2: Tools */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-6">Tools</h3>
                        <Link to="/neet-rank-predictor" className="hover:text-white transition-colors duration-200 mb-3 text-sm">NEET Rank Predictor 2026</Link>
                        <Link to="/neet-college-predictor" className="hover:text-white transition-colors duration-200 mb-3 text-sm">NEET College Predictor</Link>
                        <Link to="/rank-analysis" className="hover:text-white transition-colors duration-200 mb-3 text-sm">MBBS Cutoff Analysis</Link>
                        <Link to="/neet-test-series" className="hover:text-white transition-colors duration-200 mb-3 text-sm">NEET Test Series</Link>
                        <Link to="/roadmap" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Counselling Roadmap</Link>
                        <Link to="/state-quota-college-finder" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Fee Comparison Tool</Link>
                    </div>

                    {/* Column 3: Resources */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-6">Resources</h3>
                        <Link to="/counselling-guidance" className="hover:text-white transition-colors duration-200 mb-3 text-sm">NEET Counselling Guide 2026</Link>
                        <Link to="/private-medical-college-fees" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Private Medical College Fees</Link>
                        <Link to="/deemed-medical-colleges" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Deemed Medical Colleges India</Link>
                        <Link to="/state-wise-mbbs-cutoffs" className="hover:text-white transition-colors duration-200 mb-3 text-sm">State-wise MBBS Cutoffs</Link>
                        <Link to="/news" className="hover:text-white transition-colors duration-200 mb-3 text-sm">NEET News & Updates</Link>
                    </div>

                    {/* Column 4: Support & Legal */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-6">Support & Legal</h3>
                        <Link to="/about" className="hover:text-white transition-colors duration-200 mb-3 text-sm">About Us</Link>
                        <Link to="/contact" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Contact Us</Link>
                        <Link to="/privacy-policy" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Terms & Conditions</Link>
                        <Link to="/disclaimer" className="hover:text-white transition-colors duration-200 mb-3 text-sm">Disclaimer</Link>
                    </div>
                </div>

                {/* Trust Section */}
                <div className="bg-gray-800 rounded-lg p-6 mt-8 flex flex-wrap gap-4 justify-between items-center text-sm text-gray-300">
                    <div className="flex items-center gap-2">✔ Based on MCC & State Counselling Data</div>
                    <div className="flex items-center gap-2">✔ Updated for NEET 2026</div>
                    <div className="flex items-center gap-2">✔ No Paid College Promotions</div>
                    <div className="flex items-center gap-2">✔ Student-First & Transparent Platform</div>
                </div>

                {/* Social & Growth */}
                <div className="mt-10 border-t border-gray-800 pt-8 text-center">
                    <h4 className="text-white mb-4 font-medium">Join 10,000+ NEET Aspirants Across India 🇮🇳</h4>
                    <div className="flex justify-center gap-6">
                        <a href="#" className="text-2xl hover:scale-110 transition-transform duration-200 grayscale hover:grayscale-0" title="YouTube">▶️</a>
                        <a href="#" className="text-2xl hover:scale-110 transition-transform duration-200 grayscale hover:grayscale-0" title="Instagram">📸</a>
                        <a href="#" className="text-2xl hover:scale-110 transition-transform duration-200 grayscale hover:grayscale-0" title="Telegram">📢</a>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-8 text-xs text-gray-500 text-center leading-relaxed max-w-4xl mx-auto">
                    ⚠️ <strong>Disclaimer:</strong> This platform provides predictive analysis based on previous counselling data. Final admission depends on MCC, State Authorities, and official counselling procedures. We do not guarantee admission.
                </div>

                {/* SEO Power Links */}
                <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-gray-600">
                    <Link to="/neet-rank-predictor" className="hover:text-gray-400">NEET 2026 College Predictor</Link>
                    <span>|</span>
                    <Link to="/counselling-guidance" className="hover:text-gray-400">MBBS Admission Through NEET</Link>
                    <span>|</span>
                    <Link to="/private-finder" className="hover:text-gray-400">Private Medical Colleges in India</Link>
                    <span>|</span>
                    <Link to="/roadmap" className="hover:text-gray-400">NEET Counselling Process</Link>
                    <span>|</span>
                    <Link to="/state-quota-college-finder" className="hover:text-gray-400">Medical College Fees Structure</Link>
                </div>

                {/* Bottom Strip */}
                <div className="text-center text-gray-500 text-sm mt-10 pt-8 border-t border-gray-800">
                    © 2026 My NEET College Predictor | Built for NEET Aspirants 🇮🇳
                </div>

            </div>
        </footer>
    );
};

export default Footer;
