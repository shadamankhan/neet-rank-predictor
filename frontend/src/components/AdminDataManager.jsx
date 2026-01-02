import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from "firebase/auth";
import { getApiBase } from '../apiConfig';

// --- Custom Helpers ---
const parseCSV = (text) => {
    if (!text) return [];
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuote && nextChar === '"') {
                currentCell += '"';
                i++; // Skip escape
            } else {
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !insideQuote) {
            if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    // Push last cell/row
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }
    return rows;
};

const stringifyCSV = (rows) => {
    return rows.map(row => {
        return row.map(cell => {
            const str = cell === null || cell === undefined ? '' : String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',');
    }).join('\n');
};

const JsonTreeViewer = ({ data }) => {
    if (typeof data === 'object' && data !== null) {
        return (
            <ul className="pl-4 border-l border-slate-200 space-y-1">
                {Object.entries(data).map(([key, value]) => (
                    <li key={key} className="text-sm font-mono">
                        <span className="text-purple-600 font-semibold">{key}: </span>
                        <JsonTreeViewer data={value} />
                    </li>
                ))}
            </ul>
        );
    }
    // Primitive values
    let color = 'text-slate-700';
    if (typeof data === 'string') color = 'text-green-600';
    if (typeof data === 'number') color = 'text-blue-600';
    if (typeof data === 'boolean') color = 'text-orange-600';
    if (data === null) color = 'text-gray-400 italic';

    return <span className={`${color} break-all`}>{JSON.stringify(data)}</span>;
};
// --------------------------

const AdminDataManager = () => {
    const [fileList, setFileList] = useState({ root_data: [], backend_data: [] });
    const [selectedFile, setSelectedFile] = useState(null);
    const [content, setContent] = useState(''); // Raw content
    const [grid, setGrid] = useState([]); // Array of Arrays for CSV
    const [jsonObj, setJsonObj] = useState(null); // Parsed JSON object for Tree View
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [activeDir, setActiveDir] = useState('root_data');
    const [viewMode, setViewMode] = useState('raw'); // 'table' | 'raw' | 'tree'
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        fetchList();
    }, []);

    // Sync Raw -> Grid/Tree when switching views
    useEffect(() => {
        if (viewMode === 'table') {
            try {
                if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                    setStatus('Cannot switch to Table view: File appears to be JSON');
                    setViewMode('raw');
                } else {
                    setGrid(parseCSV(content));
                }
            } catch (e) {
                console.error("CSV Parse error", e);
            }
        } else if (viewMode === 'tree') {
            try {
                const parsed = JSON.parse(content);
                setJsonObj(parsed);
            } catch (e) {
                setStatus('Cannot switch to Tree view: Invalid JSON');
                setViewMode('raw');
            }
        }
    }, [viewMode, content]);

    const getToken = async () => {
        const auth = getAuth();
        if (auth.currentUser) return await auth.currentUser.getIdToken();
        return '';
    };

    const fetchList = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${getApiBase()}/api/admin/data/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) {
                setFileList(data.files);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadFile = async (dir, filename) => {
        setLoading(true);
        setSelectedFile({ dir, filename });
        setStatus('');
        try {
            const token = await getToken();
            const res = await fetch(`${getApiBase()}/api/admin/data/read?dir=${dir}&filename=${filename}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) {
                let fileContent = data.content;

                // Pretty print JSON content automatically
                if (filename.endsWith('.json')) {
                    try {
                        const parsed = JSON.parse(fileContent);
                        fileContent = JSON.stringify(parsed, null, 2);
                        setJsonObj(parsed);
                        setViewMode('tree'); // Default to tree for JSON
                    } catch (e) {
                        setViewMode('raw');
                    }
                } else if (filename.endsWith('.csv')) {
                    setGrid(parseCSV(data.content));
                    setViewMode('table'); // Default to table for CSV
                } else {
                    setViewMode('raw');
                }

                setContent(fileContent);
            } else {
                setStatus(data.message || 'Error loading file');
            }
        } catch (e) {
            console.error(e);
            setStatus('Error loading file');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFile = async () => {
        if (!newFileName) {
            setStatus('Please enter a filename');
            return;
        }
        if (!newFileName.endsWith('.json') && !newFileName.endsWith('.csv') && !newFileName.endsWith('.txt')) {
            setStatus('Filename must end with .json, .csv, or .txt');
            return;
        }

        setIsCreating(false);
        setLoading(true);
        try {
            const token = await getToken();
            // Create empty file
            const initialContent = newFileName.endsWith('.json') ? '{}' : '';

            const res = await fetch(`${getApiBase()}/api/admin/data/write`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    dir: activeDir,
                    filename: newFileName,
                    content: initialContent
                })
            });
            const data = await res.json();
            if (data.ok) {
                setStatus('File created!');
                setNewFileName('');
                await fetchList();
                await loadFile(activeDir, newFileName);
            } else {
                setStatus('Error creating: ' + data.message);
            }
        } catch (e) {
            console.error(e);
            setStatus('Error creating file');
        } finally {
            setLoading(false);
        }
    };

    const saveFile = async () => {
        if (!selectedFile) return;
        setLoading(true);

        // Prepare content based on active mode
        let finalContent = content;

        if (viewMode === 'table') {
            finalContent = stringifyCSV(grid);
            setContent(finalContent); // Sync back to raw
        } else if (selectedFile.filename.endsWith('.json')) {
            // Validate JSON before saving
            try {
                // Minify or keeping pretty? Keeping pretty is nicer for git/human editing
                const parsed = JSON.parse(content);
                finalContent = JSON.stringify(parsed, null, 2);
            } catch (e) {
                setStatus('Error: Invalid JSON format. Please fix syntax before saving.');
                setLoading(false);
                return;
            }
        }

        try {
            const token = await getToken();
            const res = await fetch(`${getApiBase()}/api/admin/data/write`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    dir: selectedFile.dir,
                    filename: selectedFile.filename,
                    content: finalContent
                })
            });
            const data = await res.json();
            if (data.ok) {
                setStatus('File saved successfully!');
                setTimeout(() => setStatus(''), 3000);
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

    // --- Grid Edits ---
    const updateCell = (rowIndex, colIndex, val) => {
        const newGrid = [...grid];
        // Ensure row exists
        if (!newGrid[rowIndex]) newGrid[rowIndex] = [];
        newGrid[rowIndex][colIndex] = val;
        setGrid(newGrid);
    };

    const addRow = () => {
        const colCount = grid[0] ? grid[0].length : 1;
        setGrid([...grid, new Array(colCount).fill('')]);
    };

    const deleteRow = (index) => {
        const newGrid = grid.filter((_, i) => i !== index);
        setGrid(newGrid);
    };

    const addColumn = () => {
        setGrid(grid.map(row => [...row, '']));
    };

    return (
        <div className="flex h-[85vh] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Folders</h3>
                    <div className="flex space-x-2 mb-3">
                        <button
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeDir === 'root_data' ? 'bg-white shadow text-blue-600' : 'bg-slate-200/50 text-slate-600 hover:bg-slate-200'}`}
                            onClick={() => setActiveDir('root_data')}
                        >
                            Root
                        </button>
                        <button
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeDir === 'backend_data' ? 'bg-white shadow text-blue-600' : 'bg-slate-200/50 text-slate-600 hover:bg-slate-200'}`}
                            onClick={() => setActiveDir('backend_data')}
                        >
                            Backend
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-3">
                    {loading && !content && <div className="text-center text-xs text-slate-400">Loading files...</div>}

                    {/* New File Creation */}
                    {isCreating ? (
                        <div className="px-2 py-2 bg-white rounded-lg border border-blue-200 mb-2 shadow-sm animate-fade-in-up">
                            <input
                                autoFocus
                                type="text"
                                placeholder="filename.json"
                                className="w-full text-xs p-1 border border-slate-200 rounded mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateFile();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCreateFile} className="flex-1 bg-blue-600 text-white text-[10px] py-1 rounded hover:bg-blue-700">Create</button>
                                <button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-100 text-slate-600 text-[10px] py-1 rounded hover:bg-slate-200">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full mb-2 flex items-center justify-center gap-1 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                            <span className="text-base font-bold">+</span> New File
                        </button>
                    )}

                    <ul className="space-y-0.5">
                        {fileList[activeDir]?.map(f => (
                            <li key={f}>
                                <button
                                    onClick={() => loadFile(activeDir, f)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg truncate transition-all ${selectedFile?.filename === f && selectedFile?.dir === activeDir ? 'bg-white shadow text-blue-600 font-medium' : 'hover:bg-slate-200/50 text-slate-600'}`}
                                >
                                    <span className="mr-2 text-xs opacity-50">
                                        {f.endsWith('.csv') ? '📊' : f.endsWith('.json') ? '{}' : '📄'}
                                    </span>
                                    {f}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Header */}
                <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="font-bold text-slate-800 text-lg truncate flex items-center gap-2">
                            {selectedFile ? (
                                <>
                                    <span className="p-1 rounded bg-slate-100 text-slate-500 text-sm font-normal">{selectedFile.dir} /</span>
                                    {selectedFile.filename}
                                </>
                            ) : (
                                <span className="text-slate-400 italic">No file selected</span>
                            )}
                        </div>

                        {selectedFile && (
                            <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-semibold ml-4">
                                {selectedFile.filename.endsWith('.csv') && (
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Table
                                    </button>
                                )}
                                {selectedFile.filename.endsWith('.json') && (
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'tree' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tree View
                                    </button>
                                )}
                                <button
                                    onClick={() => setViewMode('raw')}
                                    className={`px-3 py-1 rounded-md transition-all ${viewMode === 'raw' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Raw Code
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {status && (
                            <div className={`text-sm font-medium px-3 py-1 rounded-md ${status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {status}
                            </div>
                        )}
                        {selectedFile && (
                            <button
                                onClick={saveFile}
                                disabled={loading}
                                className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg shadow-sm text-sm font-bold transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative overflow-hidden">
                    {!selectedFile ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <p className="text-lg font-medium">Select a file to edit</p>
                            <p className="text-sm mt-2">Supports .CSV and .JSON</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'raw' && (
                                <textarea
                                    ref={textareaRef}
                                    className="w-full h-full p-6 font-mono text-sm resize-none focus:outline-none bg-slate-50 text-slate-800 leading-normal"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    spellCheck={false}
                                />
                            )}

                            {viewMode === 'tree' && (
                                <div className="w-full h-full overflow-auto p-8 bg-slate-50">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">JSON Visualizer</h3>
                                        <JsonTreeViewer data={jsonObj} />
                                    </div>
                                </div>
                            )}

                            {viewMode === 'table' && (
                                <div className="w-full h-full overflow-auto relative">
                                    <table className="border-collapse table-fixed min-w-full text-sm">
                                        <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                                            <tr>
                                                <th className="w-12 p-0 border-r border-b border-slate-200 bg-slate-100 sticky left-0 z-30"></th>
                                                {grid[0]?.map((_, colIndex) => (
                                                    <th key={colIndex} className="w-32 px-1 py-2 border-r border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 text-center select-none uppercase">
                                                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'][colIndex] || colIndex + 1}
                                                    </th>
                                                ))}
                                                <th className="w-10 border-b border-slate-200 bg-slate-50">
                                                    <button onClick={addColumn} className="w-full h-full text-blue-600 hover:bg-blue-50 font-bold">+</button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grid.map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    <td className="w-12 border-r border-b border-slate-200 bg-slate-50 text-center text-xs text-slate-400 sticky left-0 z-10 select-none font-mono">
                                                        {rowIndex + 1}
                                                    </td>
                                                    {row.map((cell, colIndex) => (
                                                        <td key={`${rowIndex}-${colIndex}`} className="p-0 border-r border-b border-slate-200 relative min-w-[128px]">
                                                            <input
                                                                type="text"
                                                                className="w-full h-full px-2 py-1.5 bg-white border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 absolute inset-0 text-slate-700 font-mono text-sm leading-tight outline-none"
                                                                value={cell || ''}
                                                                onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                            />
                                                            {/* Force height */}
                                                            <div className="h-8"></div>
                                                        </td>
                                                    ))}
                                                    <td className="border-b border-slate-200 text-center">
                                                        <button
                                                            onClick={() => deleteRow(rowIndex)}
                                                            className="text-slate-300 hover:text-red-500 font-bold"
                                                            title="Delete Row"
                                                        >
                                                            ×
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-4 border-t border-slate-200 bg-slate-50 sticky left-0 sticky bottom-0 z-30">
                                        <button
                                            onClick={addRow}
                                            className="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                                        >
                                            + Add New Row
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDataManager;
