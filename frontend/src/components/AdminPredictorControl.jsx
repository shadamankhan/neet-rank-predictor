import React, { useState } from 'react';

const AdminPredictorControl = () => {
    // Mock Config State
    const [config, setConfig] = useState({
        safe_rank_limit_govt: 25000,
        safe_rank_limit_private: 100000,
        risk_factor: "moderate", // conservative, moderate, aggressive
        enable_predictions: true
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = () => {
        setSaving(true);
        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            alert("Configuration saved successfully!");
        }, 1000);
    };

    return (
        <div className="max-w-4xl animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Predictor Logic Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Govt. Seat Safe Rank Limit</label>
                        <input
                            type="number"
                            name="safe_rank_limit_govt"
                            value={config.safe_rank_limit_govt}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ranks below this are marked "Safe" for Govt.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Private Seat Safe Rank Limit</label>
                        <input
                            type="number"
                            name="safe_rank_limit_private"
                            value={config.safe_rank_limit_private}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Risk Calculation Mode</label>
                        <select
                            name="risk_factor"
                            value={config.risk_factor}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="conservative">Conservative (Safest)</option>
                            <option value="moderate">Moderate (Standard)</option>
                            <option value="aggressive">Aggressive (Optimistic)</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-3 pt-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="enable_predictions"
                                checked={config.enable_predictions}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">System Active</span>
                        </label>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Update Configuration"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPredictorControl;
