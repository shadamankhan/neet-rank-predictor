import React, { useState } from 'react';
import axios from 'axios';
import QuestionBrowser from '../../components/admin/QuestionBrowser';
import { getApiBase } from '../../apiConfig';

export default function QuestionBank() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [uploading, setUploading] = useState(false);

    // Manual Question State
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualQ, setManualQ] = useState({
        question: '',
        options: ['', '', '', ''],
        answer: 0,
        explanation: '',
        subject: 'Physics'
    });

    const handleBulkUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`${getApiBase()}/api/question-bank/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.ok) {
                alert('File uploaded successfully!');
                setRefreshKey(k => k + 1);
            } else {
                alert('Upload failed: ' + res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error uploading file');
        } finally {
            setUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    const saveManualQuestion = async () => {
        if (!manualQ.question || manualQ.options.some(o => !o)) {
            alert('Please fill all fields');
            return;
        }

        try {
            const res = await axios.post(`${getApiBase()}/api/question-bank/question`, manualQ);
            if (res.data.ok) {
                alert('Question added successfully to Manual Questions!');
                setShowManualEntry(false);
                setManualQ({
                    question: '',
                    options: ['', '', '', ''],
                    answer: 0,
                    explanation: '',
                    subject: 'Physics'
                });
                setRefreshKey(k => k + 1);
            } else {
                alert('Failed to save: ' + res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error saving question');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
                    <p className="text-gray-500 mt-1">Manage, upload, and organize questions.</p>
                </div>
                <div className="flex gap-3">
                    <label className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition cursor-pointer">
                        {uploading ? 'Uploading...' : 'Bulk Upload'}
                        <input type="file" accept=".json" className="hidden" onChange={handleBulkUpload} disabled={uploading} />
                    </label>
                    <button
                        onClick={() => setShowManualEntry(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Add Question
                    </button>
                </div>
            </div>

            {/* Reusing the browser component in 'browse' mode (no selection) */}
            <div className="flex-1 overflow-hidden">
                <QuestionBrowser key={refreshKey} mode="browse" />
            </div>

            {/* Modal for Manual Question Entry */}
            {showManualEntry && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col animate-scale-up max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-lg text-gray-800">Add Manual Question</h3>
                            <button onClick={() => setShowManualEntry(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="3"
                                    placeholder="Type your question here..."
                                    value={manualQ.question}
                                    onChange={e => setManualQ({ ...manualQ, question: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={manualQ.subject}
                                    onChange={e => setManualQ({ ...manualQ, subject: e.target.value })}
                                >
                                    <option value="Physics">Physics</option>
                                    <option value="Chemistry">Chemistry</option>
                                    <option value="Botany">Botany</option>
                                    <option value="Zoology">Zoology</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                {manualQ.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={manualQ.answer === idx}
                                            onChange={() => setManualQ({ ...manualQ, answer: idx })}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            className={`flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${manualQ.answer === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...manualQ.options];
                                                newOpts[idx] = e.target.value;
                                                setManualQ({ ...manualQ, options: newOpts });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="2"
                                    placeholder="Explain the answer..."
                                    value={manualQ.explanation}
                                    onChange={e => setManualQ({ ...manualQ, explanation: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowManualEntry(false)}
                                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveManualQuestion}
                                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm"
                                >
                                    Add Question
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
