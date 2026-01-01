import React, { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';
import { fetchUserQueries } from '../api';
import MockTracker from '../components/MockTracker';
import GoalPlanner from '../components/GoalPlanner';
import EditProfileModal from '../components/EditProfileModal';
import SEO from '../components/SEO';
import './Profile.css';

export default function Profile() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('goal-planning'); // 'goal-planning', 'queries', 'mock-tests'
    const [isEditOpen, setIsEditOpen] = useState(false);

    // History removed (moved to Performance Center)
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [homeState, setHomeState] = useState('');

    useEffect(() => {
        if (user) {
            setLoading(true);
            // Load preference specific to this user
            const savedState = localStorage.getItem(`user_home_state_${user.uid}`) || '';
            setHomeState(savedState);

            user.getIdToken().then(token => {
                const p2 = fetchUserQueries(token).then(data => {
                    if (data.ok) setQueries(data.queries || []);
                }).catch(err => console.error("Queries fetch err", err));

                Promise.all([p2]).finally(() => setLoading(false));
            });
        }
    }, [user]);

    const handleSavePref = () => {
        if (user) {
            localStorage.setItem(`user_home_state_${user.uid}`, homeState);
            alert("Preferences Saved Successfully!");
        }
    };

    if (!user) return <div className="profile-container">Please log in to view profile.</div>;

    return (
        <div className="profile-wrapper">
            <SEO
                title="My Profile - NEET Rank Predictor"
                description="Manage your NEET goals, track mock test performance, and view your saved queries."
                name="NEET Profile"
            />
            <div className="profile-header-bg"></div>

            <div className="profile-content-grid">
                {/* Left Sidebar */}
                <div className="profile-sidebar">
                    <div className="user-card-main">
                        <div className="avatar-lg">
                            {user.photoURL ? <img src={user.photoURL} alt="user" /> : (user.email ? user.email[0].toUpperCase() : 'U')}
                        </div>
                        <h2 className="user-display-name">{user.displayName || "Student"}</h2>
                        <p className="user-email">{user.email}</p>
                        <div className="user-badge">Free Plan</div>
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="text-xs text-blue-600 font-semibold mt-3 hover:underline flex items-center justify-center gap-1 w-full"
                        >
                            ✏️ Edit Profile
                        </button>
                    </div>

                    <div className="settings-card">
                        <h3>⚙️ Preferences</h3>
                        <div className="form-group-col">
                            <label>Home State (Quota)</label>
                            <select value={homeState} onChange={e => setHomeState(e.target.value)} className="modern-select">
                                <option value="">Select State</option>
                                <option value="Karnataka">Karnataka</option>
                                <option value="Kerala">Kerala</option>
                                <option value="Uttar Pradesh">Uttar Pradesh</option>
                                <option value="Bihar">Bihar</option>
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Tamil Nadu">Tamil Nadu</option>
                                <option value="Delhi">Delhi</option>
                                <option value="West Bengal">West Bengal</option>
                            </select>
                            <button onClick={handleSavePref} className="btn-modern-primary">Save Changes</button>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="profile-main">

                    {/* Tabs */}
                    <div className="flex p-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl mb-6 shadow-sm">
                        <button
                            onClick={() => setActiveTab('goal-planning')}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'goal-planning' ? 'bg-white text-blue-700 shadow-md' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                        >
                            🎯 Goal / Planning
                        </button>
                        <button
                            onClick={() => setActiveTab('queries')}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'queries' ? 'bg-white text-blue-700 shadow-md' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                        >
                            💬 Queries {queries.length > 0 && `(${queries.length})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('mock-tests')}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'mock-tests' ? 'bg-white text-blue-700 shadow-md' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                        >
                            📝 Mock Tests
                        </button>
                    </div>

                    {loading ? <div className="loading-spinner">Loading...</div> : (
                        <>
                            {activeTab === 'goal-planning' && (
                                <GoalPlanner user={user} />
                            )}

                            {activeTab === 'queries' && (
                                <div className="space-y-4">
                                    {queries.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">💬</div>
                                            <p>No queries asked yet.</p>
                                        </div>
                                    ) : (
                                        queries.map(q => (
                                            <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-gray-800 text-sm">Query about NEET Rank {q.rank || 'N/A'}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${q.status === 'Replied' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'}`}>
                                                        {q.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-3 bg-gray-50 p-3 rounded">{q.query}</p>

                                                {q.adminReply && (
                                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                                        <p className="text-xs font-bold text-blue-700 mb-1">Expert Reply:</p>
                                                        <p className="text-gray-800 text-sm">{q.adminReply}</p>
                                                    </div>
                                                )}

                                                <div className="mt-2 text-right text-xs text-gray-400">
                                                    {new Date(q.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'mock-tests' && (
                                <MockTracker user={user} />
                            )}
                        </>
                    )}
                </div>
            </div>
            {user && <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} user={user} />}
        </div>
    );
}
