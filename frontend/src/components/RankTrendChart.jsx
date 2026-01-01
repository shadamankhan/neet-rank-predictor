import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RankTrendChart({ history }) {
    if (!history) return null;

    // Transform history object { 2021: 100, 2022: 200 } to array
    // Filter out nulls
    const data = Object.keys(history)
        .sort()
        .map(year => ({
            year,
            rank: history[year]
        }))
        .filter(item => item.rank !== null && item.rank > 0);

    if (data.length < 2) {
        return <div style={{ color: '#666', fontStyle: 'italic', padding: 10 }}>Insufficient data for trend chart.</div>;
    }

    return (
        <div style={{ width: '100%', height: 300, background: 'white', borderRadius: 12, padding: '10px 10px 0 0', boxSizing: 'border-box' }}>
            <h4 style={{ margin: '0 0 10px 20px', color: '#333' }}>Rank Inflation Trend</h4>
            <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                <ResponsiveContainer width="99%" height="100%" debounce={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis
                            dataKey="year"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 12 }}
                        />
                        <YAxis
                            reversed={true} // Lower rank is better (higher up)
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 12 }}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value) => [`${value.toLocaleString()}`, 'Rank']}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="rank"
                            stroke="#8884d8"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
