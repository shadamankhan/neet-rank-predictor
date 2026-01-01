import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";

// Using SimpleMarkdown custom component below instead of external dependency to avoid install errors
// Given the user constraint, I'll use a simple parser for now to avoid dependency issues if not present.
// If 'react-markdown' is not in package.json, I will write a simple renderer.

const SimpleMarkdown = ({ content }) => {
    if (!content) return null;
    return (
        <div className="prose prose-sm max-w-none text-slate-700">
            {content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-3 mb-2">{line.replace('## ', '')}</h2>;
                if (line.startsWith('- [ ] ')) return (
                    <div key={i} className="flex items-center gap-2 my-1">
                        <div className="w-4 h-4 border-2 border-slate-300 rounded-sm"></div>
                        <span>{line.replace('- [ ] ', '')}</span>
                    </div>
                );
                if (line.startsWith('- [x] ')) return (
                    <div key={i} className="flex items-center gap-2 my-1 text-slate-400 line-through">
                        <div className="w-4 h-4 bg-blue-500 border-2 border-blue-500 rounded-sm flex items-center justify-center text-white text-[10px]">✓</div>
                        <span>{line.replace('- [x] ', '')}</span>
                    </div>
                );
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="my-1">{line}</p>;
            })}
        </div>
    );
};

const AdminChecklist = () => {
    const FILENAME = 'project_status.md';
    const DIR = 'backend_data'; // Store in backend/data
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [mode, setMode] = useState('edit'); // 'edit' | 'preview'

    useEffect(() => {
        loadChecklist();
    }, []);

    const getToken = async () => {
        const auth = getAuth();
        if (auth.currentUser) return await auth.currentUser.getIdToken();
        return '';
    };

    const loadChecklist = async () => {
        setLoading(true);
        setStatus('Loading...');
        try {
            const token = await getToken();
            const res = await fetch(`/api/admin/data/read?dir=${DIR}&filename=${FILENAME}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) {
                setContent(data.content);
                setStatus('');
            } else if (data.code === 'FILE_NOT_FOUND') {
                // Create if not exists
                setContent("# Project Status Checklist\n\n- [ ] Initial Setup\n");
                setStatus('New checklist initialized (unsaved)');
            } else {
                setStatus('Error loading checklist: ' + data.message);
            }
        } catch (e) {
            console.error(e);
            setStatus('Error loading');
        } finally {
            setLoading(false);
        }
    };

    const saveChecklist = async () => {
        setLoading(true);
        setStatus('Saving...');
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/data/write', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    dir: DIR,
                    filename: FILENAME,
                    content
                })
            });
            const data = await res.json();
            if (data.ok) {
                setStatus('Checklist saved!');
                setTimeout(() => setStatus(''), 2000);
            } else {
                setStatus('Error saving: ' + data.message);
            }
        } catch (e) {
            console.error(e);
            setStatus('Error saving');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">Project Tracker</h3>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button
                            onClick={() => setMode('edit')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${mode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setMode('preview')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${mode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Preview
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <span className="text-sm text-slate-500 italic transition-opacity duration-500">{status}</span>
                    <button
                        onClick={saveChecklist}
                        disabled={loading}
                        className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Checklist'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 relative">
                {mode === 'edit' ? (
                    <textarea
                        className="w-full h-full p-8 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-slate-50 text-slate-700"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="# Project Status\n\n- [ ] Task 1"
                        spellCheck={false}
                    />
                ) : (
                    <div className="p-8 max-w-3xl mx-auto bg-white min-h-full shadow-sm border-x border-slate-100">
                        <SimpleMarkdown content={content} />
                    </div>
                )}
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 font-mono">
                Source: {DIR}/{FILENAME}
            </div>
        </div>
    );
};

export default AdminChecklist;
