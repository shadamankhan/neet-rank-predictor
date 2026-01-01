import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../useAuth';
import { getApiBase } from '../apiConfig';

export default function AskQueryModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ name: '', phone: '', rank: '', query: '' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [visible, setVisible] = useState(false);

    // Auto-fill
    useEffect(() => {
        if (user && isOpen) {
            setFormData(prev => ({
                ...prev,
                name: user.displayName || prev.name
            }));
        }
    }, [user, isOpen]);

    // Focus Trap & Keyboard Support
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => setVisible(true), 10);

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                    return;
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'unset';
            };
        } else {
            setVisible(false);
            const timer = setTimeout(() => {
                document.body.style.overflow = 'unset';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen && !visible) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                email: user?.email,
                uid: user?.uid
            };

            const res = await fetch(`${getApiBase()}/api/queries/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setVisible(false);
                    setTimeout(() => {
                        onClose();
                        setSuccess(false);
                        setFormData({ name: '', phone: '', rank: '', query: '' });
                    }, 300);
                }, 2000);
            } else {
                alert("Failed: " + data.message);
            }
        } catch (err) {
            alert("Error submitting query");
        } finally {
            setSubmitting(false);
        }
    };

    const modalContent = (
        <div id="ask-query-modal" className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}></div>
            <div className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Expert Guidance</h2>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Online & Ready to Help
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 p-1.5 rounded-lg transition-all" aria-label="Close">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {success ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center mb-6 animate-bounce-short">
                            <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                        <p className="text-gray-500 text-sm">We'll analyze your query and get back to you shortly.</p>
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto max-h-[80vh]">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</label>
                                    <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="Your Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Phone</label>
                                    <input required type="tel" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="Mobile Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">NEET Rank <span className="text-gray-400 font-normal lowercase">(optional)</span></label>
                                <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="e.g. 15000" value={formData.rank} onChange={e => setFormData({ ...formData, rank: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Your Query</label>
                                <textarea required rows="4" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm resize-none" placeholder="Type your question here..." value={formData.query} onChange={e => setFormData({ ...formData, query: e.target.value })}></textarea>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full mt-2 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-gray-900/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                                {submitting ? <span>Submitting...</span> : <span>Get Free Advice</span>}
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-2">By submitting, you agree to our privacy policy.</p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
