'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Sample data for the chart
const data = [
  { day: 'Mon', efficiency: 85, target: 90 },
  { day: 'Tue', efficiency: 88, target: 90 },
  { day: 'Wed', efficiency: 92, target: 90 },
  { day: 'Thu', efficiency: 91, target: 90 },
  { day: 'Fri', efficiency: 94, target: 90 },
  { day: 'Sat', efficiency: 87, target: 90 },
  { day: 'Sun', efficiency: 82, target: 90 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ 
        background: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <p className="label" style={{ margin: 0 }}>{`${label}`}</p>
        <p style={{ margin: '5px 0', color: '#3b82f6' }}>
          {`Efficiency: ${payload[0].value}%`}
        </p>
        <p style={{ margin: 0, color: '#ef4444' }}>
          {`Target: ${payload[1].value}%`}
        </p>
      </div>
    );
  }

  return null;
};

export default function ProductionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="day" 
          tick={{ fill: '#64748b' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tick={{ fill: '#64748b' }}
          axisLine={{ stroke: '#e5e7eb' }}
          domain={[75, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area
          type="monotone"
          dataKey="efficiency"
          stroke="#3b82f6"
          fill="#93c5fd"
          name="Production Efficiency"
        />
        <Area
          type="monotone"
          dataKey="target"
          stroke="#ef4444"
          fill="rgba(0, 0, 0, 0)"
          name="Target Efficiency"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 