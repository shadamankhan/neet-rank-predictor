import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { getApiBase } from '../apiConfig';

const AdminQueryManager = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchQueries();
    }, []);

    const getToken = async () => {
        const auth = getAuth();
        if (auth.currentUser) return await auth.currentUser.getIdToken();
        return '';
    };

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${getApiBase()}/api/queries/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) {
                setQueries(data.queries);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (id) => {
        if (!replyText) return;
        try {
            const token = await getToken();
            const res = await fetch(`${getApiBase()}/api/queries/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id,
                    reply: replyText,
                    status: 'Replied'
                })
            });
            const data = await res.json();
            if (data.ok) {
                setStatus('Reply saved');
                setReplyingTo(null);
                setReplyText('');
                fetchQueries();
                setTimeout(() => setStatus(''), 3000);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startReply = (q) => {
        setReplyingTo(q.id);
        setReplyText(q.adminReply || '');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">User Queries</h2>
                <div className="flex gap-2">
                    <button onClick={fetchQueries} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Refresh</button>
                    {status && <span className="text-sm text-green-600 font-medium animate-pulse">{status}</span>}
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading && queries.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Loading queries...</div>
                ) : queries.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No queries found.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Query</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {queries.map((q) => (
                                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 align-top w-48">
                                        <div className="font-bold text-slate-700">{q.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{q.phone}</div>
                                        {q.rank && <div className="text-xs text-blue-600 mt-1 font-medium">Rank: {q.rank}</div>}
                                        <div className="text-[10px] text-slate-400 mt-2">{new Date(q.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="text-slate-800 mb-2 whitespace-pre-wrap">{q.query}</div>
                                        {q.adminReply && !replyingTo === q.id && (
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                                                <div className="text-xs font-bold text-blue-600 mb-1">Admin Reply:</div>
                                                <div className="text-slate-700 text-sm">{q.adminReply}</div>
                                            </div>
                                        )}
                                        {replyingTo === q.id && (
                                            <div className="mt-2 space-y-2 animate-fade-in">
                                                <textarea
                                                    autoFocus
                                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    rows="3"
                                                    placeholder="Type your reply..."
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                ></textarea>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleReply(q.id)}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700"
                                                    >
                                                        Send Reply
                                                    </button>
                                                    <button
                                                        onClick={() => setReplyingTo(null)}
                                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top w-32">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${q.status === 'Replied' ? 'bg-green-100 text-green-800' :
                                                q.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {q.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 align-top w-32">
                                        {replyingTo !== q.id && (
                                            <button
                                                onClick={() => startReply(q)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                                            >
                                                {q.adminReply ? 'Edit Reply' : 'Reply'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminQueryManager;
