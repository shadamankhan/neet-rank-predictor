import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBase } from '../../apiConfig';

export default function SmartGeneratorModal({ isOpen, onClose, onGenerate }) {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('Physics');
    const [selectedChapter, setSelectedChapter] = useState('');
    const [questionCount, setQuestionCount] = useState(45);

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen]);

    const fetchFiles = async () => {
        try {
            const res = await axios.get(`${getApiBase()}/api/question-bank/files`);
            if (res.data.ok) {
                setFiles(res.data.files);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerate = async () => {
        if (!selectedChapter) {
            alert("Please select a chapter");
            return;
        }

        setLoading(true);
        try {
            // Encode filename to handle spaces/special chars
            const encodedFile = selectedChapter.split('/').map(segment => encodeURIComponent(segment)).join('/');
            const res = await axios.get(`${getApiBase()}/api/question-bank/files/${encodedFile}`);

            if (res.data.ok && Array.isArray(res.data.data)) {
                let allQuestions = res.data.data;

                // Shuffle
                for (let i = allQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
                }

                // Slice
                const selectedQuestions = allQuestions.slice(0, parseInt(questionCount));

                // Add subject/source metadata
                const processedQuestions = selectedQuestions.map(q => ({
                    ...q,
                    subject: selectedSubject,
                    _source: selectedChapter
                }));

                const chapterName = selectedChapter.split('/').pop().replace(/\.json$/i, '');

                onGenerate(processedQuestions, [chapterName]);
                onClose();
            } else {
                alert("Failed to load questions from this chapter.");
            }
        } catch (err) {
            console.error(err);
            alert("Error generating test");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(selectedSubject.toLowerCase()) || selectedSubject === 'All');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-white/20">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span>⚡</span> Smart Test Generator
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">Generate a test instantly from your bank.</p>
                </div>

                <div className="p-6 space-y-5">

                    {/* Subject Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Botany">Botany</option>
                            <option value="Zoology">Zoology</option>
                        </select>
                    </div>

                    {/* Chapter Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Target Chapter</label>
                        <select
                            value={selectedChapter}
                            onChange={e => setSelectedChapter(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">-- Select Chapter --</option>
                            {filteredFiles.map((f, i) => (
                                <option key={i} value={f.name}>
                                    {f.name.replace(/\.json$/i, '')}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Only shows files matching the subject.</p>
                    </div>

                    {/* Question Count */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Number of Questions</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={questionCount}
                                onChange={e => setQuestionCount(e.target.value)}
                                className="flex-1 accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg min-w-[3rem] text-center border border-purple-100">
                                {questionCount}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !selectedChapter}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2
                                ${loading || !selectedChapter
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span>✨</span> Generate Test
                                </>
                            )}
                        </button>
                    </div>

                </div>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/70 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    );
}
