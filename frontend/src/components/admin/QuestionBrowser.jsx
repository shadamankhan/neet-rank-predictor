import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../../apiConfig';

export default function QuestionBrowser({ onAddQuestions, mode = 'browse', preSelectedSubject = 'Physics', preSelectedChapters = [] }) {
    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState(new Set()); // Multi-file selection

    // Unified Question Pool
    const [poolQuestions, setPoolQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedQuestionIndices, setSelectedQuestionIndices] = useState(new Set()); // IDs (pool index)
    const [selectedSubject, setSelectedSubject] = useState(preSelectedSubject.split(' ')[0]); // Default tag (remove " (Physical)")
    const [fileFilter, setFileFilter] = useState(preSelectedSubject.split(' ')[0]); // Filter for sidebar

    const [uploading, setUploading] = useState(false);

    // AI / Smart Tools State
    const [aiQuery, setAiQuery] = useState('');

    useEffect(() => {
        fetchFiles();
    }, []);

    // Auto-select files when files are loaded and preSelectedChapters exists
    useEffect(() => {
        if (files.length > 0 && preSelectedChapters.length > 0) {
            const matchedFiles = new Set();
            files.forEach(f => {
                const lowerName = f.name.toLowerCase();
                // Check if any tag is contained in the filename
                const isMatch = preSelectedChapters.some(tag => lowerName.includes(tag.toLowerCase()));
                if (isMatch) matchedFiles.add(f.name);
            });
            if (matchedFiles.size > 0) {
                setSelectedFiles(matchedFiles);
                // Optional: Auto-load? Maybe wait for user to click load to avoid accidental heavy load
                // But user expects "Coaching Style" to just work. Let's not auto-load, just pre-select. 
                // Better: show a notification? No, just selecting is good.
            }
        }
    }, [files, preSelectedChapters]);

    const fetchFiles = async () => {
        try {
            const res = await axios.get(`${getApiBase()}/api/question-bank/files`);
            if (res.data.ok) {
                setFiles(res.data.files);
            }
        } catch (err) { console.error(err); }
    };

    // Toggle File Selection
    const toggleFile = (filename) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(filename)) newSet.delete(filename);
        else newSet.add(filename);
        setSelectedFiles(newSet);
    };

    // Load Questions from ALL selected files
    const loadSelectedFiles = async () => {
        if (selectedFiles.size === 0) return;
        setLoading(true);
        let allQs = [];

        try {
            for (const file of selectedFiles) {
                // Encode each segment of the path to handle spaces (e.g. "Laws of Motion.json") 
                // but preserve the slash separator so backend routing treats it as a path.
                const encodedFile = file.split('/').map(segment => encodeURIComponent(segment)).join('/');
                const res = await axios.get(`${getApiBase()}/api/question-bank/files/${encodedFile}`);
                if (res.data.ok && Array.isArray(res.data.data)) {
                    // Tag with source file for tracking
                    const qs = res.data.data.map(q => ({ ...q, _source: file }));
                    allQs = [...allQs, ...qs];
                }
            }
            setPoolQuestions(allQs);
            setSelectedQuestionIndices(new Set()); // Reset selection
        } catch (err) {
            alert("Error loading questions");
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestionSelect = (index) => {
        const newSet = new Set(selectedQuestionIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedQuestionIndices(newSet);
    };

    const handleAddSelected = () => {
        if (!onAddQuestions) return;
        const selectedQs = poolQuestions
            .filter((_, idx) => selectedQuestionIndices.has(idx))
            .map(q => ({
                ...q,
                subject: selectedSubject,
                // Infer subject from file if possible, else use selectedSubject
                // Logic: if q._source has 'physics', override? For now stick to manual override
            }));

        // Extract unique chapters (files) from selected questions
        const sources = new Set();
        selectedQs.forEach(q => {
            if (q._source) {
                // Clean up filename: remove extension and path
                const name = q._source.split('/').pop().replace('.json', '').replace(/\.json$/i, ''); // Handle varied extensions if any
                sources.add(name);
            }
        });

        // Fallback: If no sources detected from questions, use currently selected files
        if (sources.size === 0 && selectedFiles.size > 0) {
            selectedFiles.forEach(f => {
                const name = f.split('/').pop().replace('.json', '').replace(/\.json$/i, '');
                sources.add(name);
            });
        }

        onAddQuestions(selectedQs, Array.from(sources));
        setSelectedFiles(new Set()); // Optional: clear file selection? No, keep it.
        // But clear question selection
        setSelectedQuestionIndices(new Set());
    };

    // --- AI / SMART TOOLS ---
    const runAiSelect = () => {
        if (!poolQuestions.length) return;

        // Simple Heuristic AI: "Select 10 random" vs "Search text"
        let matches = [];

        if (aiQuery.toLowerCase().includes('random') || aiQuery.match(/^\d+$/)) {
            // Random N
            const count = parseInt(aiQuery.match(/\d+/)?.[0] || 10);
            const indices = Array.from({ length: poolQuestions.length }, (_, i) => i);
            const shuffled = indices.sort(() => 0.5 - Math.random()).slice(0, count);
            matches = shuffled;
        } else if (aiQuery) {
            // Text Search
            const lowerQ = aiQuery.toLowerCase();
            poolQuestions.forEach((q, idx) => {
                if (q.question.toLowerCase().includes(lowerQ)) matches.push(idx);
            });
        } else {
            // Select All (default if empty?)
            alert("Type '10' for random 10, or 'torque' to search.");
            return;
        }

        const newSet = new Set(selectedQuestionIndices);
        matches.forEach(idx => newSet.add(idx));
        setSelectedQuestionIndices(newSet);
        alert(`AI Selected ${matches.length} questions matching your criteria.`);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex h-full overflow-hidden">

            {/* LEFT: File / Chapter Selection (Sidebar) */}
            <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800">1. Select Chapters</h3>
                    <p className="text-xs text-gray-500 mb-2">Tick boxes to load questions</p>
                    {/* Subject Filter Dropdown */}
                    <select
                        value={fileFilter}
                        onChange={(e) => setFileFilter(e.target.value)}
                        className="w-full text-xs p-2 border rounded bg-gray-50 font-medium"
                    >
                        <option value="All">All Subjects</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Botany">Botany</option>
                        <option value="Zoology">Zoology</option>
                    </select>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {files.filter(f => {
                        if (fileFilter === 'All') return true;
                        // Match folder name or loose file naming convention
                        // e.g. "physics/...", "botany/..." or "Chemistry 1.json"
                        const lowerName = f.name.toLowerCase();
                        const lowerFilter = fileFilter.toLowerCase();
                        return lowerName.includes(lowerFilter);
                    }).map((file, idx) => (
                        <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedFiles.has(file.name) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                            <input
                                type="checkbox"
                                checked={selectedFiles.has(file.name)}
                                onChange={() => toggleFile(file.name)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate" title={file.name}>{file.name.replace('.json', '')}</p>
                                <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                        </label>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={loadSelectedFiles}
                        disabled={selectedFiles.size === 0 || loading}
                        className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${selectedFiles.size > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
                    >
                        {loading ? 'Loading...' : `Load Questions (${selectedFiles.size})`}
                    </button>
                </div>
            </div>

            {/* RIGHT: Question Pool & Selection */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-gray-800">2. Select Questions</h3>
                        <p className="text-xs text-gray-500">{poolQuestions.length} loaded from selected chapters</p>
                    </div>

                    {/* AI Smart Select Bar */}
                    <div className="flex-1 max-w-md relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-lg">✨</span>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-20 py-2 border border-purple-200 rounded-lg bg-purple-50 focus:ring-2 focus:ring-purple-400 outline-none text-sm text-purple-900 placeholder-purple-300"
                            placeholder="Type '20' for random, or 'hard'..."
                            value={aiQuery}
                            onChange={e => setAiQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && runAiSelect()}
                        />
                        <button
                            onClick={runAiSelect}
                            className="absolute right-1 top-1 bottom-1 px-3 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700"
                        >
                            AI Select
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                        >
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Botany">Botany</option>
                            <option value="Zoology">Zoology</option>
                        </select>
                        {onAddQuestions && (
                            <button
                                onClick={handleAddSelected}
                                disabled={selectedQuestionIndices.size === 0}
                                className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition ${selectedQuestionIndices.size > 0 ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                                Add Selected ({selectedQuestionIndices.size})
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 content-start">
                    {poolQuestions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            <p>Select chapters on the left and click 'Load Questions'</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {poolQuestions.map((q, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => toggleQuestionSelect(idx)}
                                    className={`relative border rounded-xl p-4 transition cursor-pointer flex gap-4 ${selectedQuestionIndices.has(idx) ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200 hover:border-blue-400 bg-white'}`}
                                >
                                    {/* Selection Checkbox Visual */}
                                    <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5 transition ${selectedQuestionIndices.has(idx) ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 bg-white'}`}>
                                        {selectedQuestionIndices.has(idx) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex gap-2 mb-1">
                                            {q._source && <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 rounded truncate max-w-[150px]">{q._source.replace('.json', '')}</span>}
                                        </div>
                                        <p className="text-gray-900 font-medium text-sm leading-relaxed">{q.question}</p>
                                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                                            {q.options?.map((opt, oid) => (
                                                <span key={oid} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">{opt.substring(0, 30)}...</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper End

