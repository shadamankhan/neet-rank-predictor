import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiBase } from '../../apiConfig';

export default function TestResults() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testName, setTestName] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await axios.get(`${getApiBase()}/api/test-series/test/${testId}/results`);
                if (res.data.ok) {
                    setResults(res.data.results);
                    if (res.data.results.length > 0) {
                        setTestName(res.data.results[0].testName);
                    } else {
                        // Fallback to fetch test details if no results yet, but for now just show ID or generic
                        setTestName('Test Results');
                    }
                }
            } catch (err) {
                console.error("Failed to load results", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [testId]);

    const getScoreColor = (score, total) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return 'text-green-600 bg-green-50';
        if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <button
                        onClick={() => navigate('/admin/tests')}
                        className="text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2 text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Back to Test Series
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{testName} - Leaderboard</h1>
                    <p className="text-gray-500 mt-1">Total Attempts: {results.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Rank</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Student</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-center">Score</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-center">Accuracy</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-center">Attempted</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">Loading results...</td>
                                </tr>
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">No students have taken this test yet.</td>
                                </tr>
                            ) : (
                                results.map((res, idx) => (
                                    <tr key={res.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                                                }`}>
                                                #{idx + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">Student (UID: {res.uid.substring(0, 6)})</div>
                                            <button
                                                onClick={() => navigate(`/admin/students/${res.uid}`)}
                                                className="text-xs text-blue-500 hover:underline"
                                            >
                                                View Profile
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full font-bold text-sm ${getScoreColor(res.score, res.totalMarks)}`}>
                                                {res.score} / {res.totalMarks}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                                            {res.accuracy}%
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                                            {res.attempted} Qs
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                                            {new Date(res.date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
