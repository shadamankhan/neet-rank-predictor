import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
    // Mock Data for Visualization
    const metrics = [
        { label: "Total Predictions", value: "12,450", change: "+12%", color: "blue" },
        { label: "Active Users (Today)", value: "843", change: "+5%", color: "green" },
        { label: "Most Searched State", value: "Karnataka", change: "stable", color: "purple" },
        { label: "WhatsApp Queries", value: "128", change: "+24%", color: "orange" },
    ];

    const data = [
        { range: '0-5k', users: 400 },
        { range: '5k-10k', users: 300 },
        { range: '10k-50k', users: 600 },
        { range: '50k-1L', users: 800 },
        { range: '1L-5L', users: 500 },
        { range: '5L+', users: 200 },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, idx) => (
                    <div key={idx} className={`bg-white p-5 rounded-lg shadow-sm border-l-4 border-${m.color}-500`}>
                        <p className="text-gray-500 text-sm font-semibold uppercase">{m.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{m.value}</h3>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-2 inline-block">
                            {m.change}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">User Rank Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="users" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Side Activity Feed */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                    <ul className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <li key={i} className="flex items-center space-x-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-gray-600">New user registered from <span className="font-semibold text-gray-800">Mumbai</span></span>
                                <span className="text-gray-400 text-xs ml-auto">2m ago</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
