import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";

const AdminCounsellingLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // In a real app we'd pass auth token, but for now our backend is open per requirement
            const auth = getAuth();
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

            if (!token) {
                console.error("No auth token available");
                return;
            }

            const res = await fetch('/api/queries/list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.ok) {
                setLogs(data.queries || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (id) => {
        const reply = prompt("Enter your reply (Simulated):");
        if (reply) {
            const auth = getAuth();
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

            const res = await fetch('/api/queries/reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, reply, status: 'Replied' })
            });
            const data = await res.json();
            if (data.ok) fetchLogs();
        }
    };

    const filteredLogs = filter === 'All' ? logs : logs.filter(l => l.status === filter);

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Counselling Queries</h3>
                <div className="space-x-2">
                    {['All', 'Pending', 'Replied'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-blue-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading queries...</div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        <p className="text-lg">No queries received yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">User</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Contact</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Rank</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Query</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Time</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{log.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{log.phone}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono">{log.rank}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium max-w-xs truncate" title={log.query}>
                                            {log.query}
                                            {log.adminReply && <div className="text-xs text-green-600 mt-1">Reply: {log.adminReply}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                log.status === 'Replied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {new Date(log.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleReply(log.id)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                                            >
                                                Reply
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCounsellingLogs;
