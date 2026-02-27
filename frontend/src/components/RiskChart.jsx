import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
}

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
            {value}
        </text>
    )
}

export default function RiskChart({ data = [] }) {
    const pieData = data.map((d) => ({
        name: d.bucket.charAt(0).toUpperCase() + d.bucket.slice(1),
        value: d.count,
        fill: COLORS[d.bucket] || '#6366f1',
    }))

    if (!pieData.length || pieData.every((d) => d.value === 0)) {
        return (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                No risk data
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    labelLine={false}
                    label={renderLabel}
                >
                    {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(val, name) => [val, name]}
                />
                <Legend
                    wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
                    iconType="circle"
                />
            </PieChart>
        </ResponsiveContainer>
    )
}
