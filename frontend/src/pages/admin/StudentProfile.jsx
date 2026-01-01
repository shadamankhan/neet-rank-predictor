import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentProfile() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentDetail();
    }, [uid]);

    const fetchStudentDetail = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/students/${uid}`);
            if (res.data.ok) {
                setData(res.data);
            }
        } catch (err) {
            console.error("Failed to load student detail", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    if (!data) return <div className="p-8 text-center text-gray-500">Student not found</div>;

    const { profile, stats, history } = data;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/admin/students')}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4 text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    Back to Students
                </button>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                            <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    {profile.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    {profile.phone}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Total Tests Taken</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.testsTaken}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Highest Score</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.highestScore} <span className="text-sm font-normal text-gray-400">/ 720</span></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Average Score</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.avgScore} <span className="text-sm font-normal text-gray-400">/ 720</span></div>
                </div>
            </div>

            {/* Test History List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Test History</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {history.tests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No tests attempted yet.</div>
                    ) : (
                        history.tests.map((test, idx) => (
                            <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                                <div>
                                    <h4 className="font-medium text-gray-900">{test.testName}</h4>
                                    <div className="text-sm text-gray-500">{new Date(test.date).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 text-lg">{test.score} <span className="text-xs font-normal text-gray-500">/ {test.totalMarks}</span></div>
                                    <div className={`text-xs font-bold ${(test.score / test.totalMarks) >= 0.8 ? 'text-green-600' :
                                            (test.score / test.totalMarks) >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {Math.round((test.score / test.totalMarks) * 100)}%
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Queries List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Student Queries</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {history.queries.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No queries submitted.</div>
                    ) : (
                        history.queries.map((q, idx) => (
                            <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition">
                                <div className="flex justify-between mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${q.status === 'Replied' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.status}</span>
                                    <span className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-800 text-sm mb-2">"{q.query}"</p>
                                {q.adminReply && (
                                    <div className="bg-gray-50 p-2 rounded text-sm text-gray-600 border border-gray-100">
                                        <span className="font-bold text-blue-600">Reply: </span> {q.adminReply}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
