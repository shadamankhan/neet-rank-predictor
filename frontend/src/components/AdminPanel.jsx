// src/components/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { isAdminEmail } from "../utils/adminConfig";
import AdminDistributionUploader from "./AdminDistributionUploader";
import AdminDataManager from "./AdminDataManager";
import AdminChecklist from "./AdminChecklist";
import AdminDashboard from "./AdminDashboard";
import AdminPredictorControl from "./AdminPredictorControl";
import AdminCounsellingLogs from "./AdminCounsellingLogs";
import AdminQueryManager from "./AdminQueryManager";
import QuizManager from "./admin/QuizManager";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [isAdminClaim, setIsAdminClaim] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth check
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoadingAuth(false);
      if (!u) {
        setUser(null);
        setIsAdminClaim(false);
        return;
      }
      setUser(u);

      try {
        const idTokenResult = await u.getIdTokenResult(false);
        const claims = idTokenResult.claims || {};
        // Allow if custom claim exists OR if email is in allowed list
        const isAllowedEmail = isAdminEmail(u.email);

        setIsAdminClaim(Boolean(claims.isAdmin || claims.admin || isAllowedEmail));
      } catch (err) {
        console.warn("Failed to read token claims", err);
      }
    });
    return () => unsub();
  }, []);

  if (loadingAuth) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-pulse text-blue-600 font-semibold">Loading Admin Console...</div>
    </div>
  );

  // Strict Access Control
  if (!user || !isAdminClaim) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4 0h2m-2 0a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2h2m-2-4h.01M17 16h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2h2m10-4h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2h2"></path></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You do not have permission to access the admin console.<br />
          <span className="text-xs text-gray-400 mt-2 block">Current User: {user.email}</span>
        </p>
        <a href="/" className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition">Return Home</a>
      </div>
    </div>
  );

  const sidebarItems = [
    {
      id: 'dashboard', label: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
      )
    },
    {
      id: 'queries', label: 'User Queries', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      )
    },
    {
      id: 'counselling', label: 'Counselling Logs', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      )
    },
    {
      id: 'predictor', label: 'Predictor Control', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      )
    },
    {
      id: 'data', label: 'Data Manager', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
      )
    },
    {
      id: 'checklist', label: 'Project Tracker', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )
    },
    {
      id: 'quizzes', label: 'Quiz Manager', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
      )
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow flex items-center justify-center text-white font-bold">A</div>
          <span className="text-lg font-bold text-gray-800">Admin Console</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="font-bold text-gray-800">Admin Console</div>
          <div className="flex space-x-2">
            {sidebarItems.slice(0, 3).map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-2 rounded ${activeTab === item.id ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}>
                {item.icon}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {sidebarItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage your application settings and data.</p>
            </div>

            {/* Content Switcher */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <AdminDashboard />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                      Upload Data
                    </h2>
                    <AdminDistributionUploader />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'counselling' && <AdminCounsellingLogs />}
            {activeTab === 'predictor' && <AdminPredictorControl />}
            {activeTab === 'data' && <AdminDataManager />}
            {activeTab === 'checklist' && <AdminChecklist />}
            {activeTab === 'queries' && <AdminQueryManager />}
            {activeTab === 'quizzes' && <QuizManager />}
          </div>
        </div>
      </main>
    </div>
  );
}
