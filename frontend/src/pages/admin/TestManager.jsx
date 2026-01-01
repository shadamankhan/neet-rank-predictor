import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

export default function TestManager() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            // In a real app, use the auth token if your API is protected
            // const auth = getAuth();
            // const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

            const res = await axios.get('http://localhost:5000/api/test-series');
            if (res.data.ok) {
                setTests(res.data.tests || []);
            }
        } catch (err) {
            console.error("Failed to fetch tests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) return;

        try {
            const res = await axios.delete(`http://localhost:5000/api/test-series/${id}`);
            if (res.data.ok) {
                setTests(tests.filter(t => t.id !== id));
            } else {
                alert("Failed to delete test");
            }
        } catch (err) {
            console.error("Error deleting test", err);
            alert("Error deleting test");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Test Series Manager</h1>
                    <p className="text-gray-500 mt-1">Create, edit, and schedule test series packages.</p>
                </div>
                <button
                    onClick={() => navigate('/admin/tests/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Create New Test
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading tests...</div>
            ) : tests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Tests Created Yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2 mb-6">Get started by creating your first test series. You can configure subjects, duration, and marking schemes.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tests.map(test => (
                        <div key={test.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                    <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">{test.type}</span>
                                    {test.isPremium ? (
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded border border-yellow-200 text-xs font-bold">Premium (₹{test.price})</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded border border-green-200 text-xs font-bold">Free</span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded border text-xs font-bold ${test.status === 'Live' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {test.status || 'Draft'}
                                    </span>
                                    <span>{test.duration} mins</span>
                                    <span>{test.totalMarks} marks</span>
                                    <span>{test.questions?.length || 0} Questions</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate(`/admin/tests/${test.id}/results`)}
                                    className="text-green-600 hover:text-green-800 font-medium text-sm border border-green-200 px-3 py-1 rounded bg-green-50 hover:bg-green-100 transition"
                                >
                                    View Results
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(test.id)}
                                    className="text-red-500 hover:text-red-700 font-medium text-sm border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
