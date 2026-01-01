import React from 'react';

export default function AdminDashboard() {
    const stats = [
        { label: 'Total Users', value: '1,234', change: '+12%', color: 'blue' },
        { label: 'Active Tests', value: '56', change: '+3', color: 'green' },
        { label: 'Questions', value: '8,900', change: '+150', color: 'indigo' },
        { label: 'Predictions', value: '45,678', change: '+5%', color: 'purple' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <div className="mt-2 flex items-baseline">
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            <span className={`ml-2 text-sm font-medium text-${stat.color}-600`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <p className="text-sm text-gray-600">New user registration <span className="text-xs text-gray-400">2 mins ago</span></p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Database</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Operational</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">API Gateway</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
