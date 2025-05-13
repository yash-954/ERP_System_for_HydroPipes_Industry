'use client';
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

// Sample data for the chart
const data = [
  { name: 'Hydraulic Pumps', value: 42, color: '#3b82f6' },
  { name: 'Valves', value: 28, color: '#10b981' },
  { name: 'Cylinders', value: 15, color: '#f59e0b' },
  { name: 'Pipes & Hoses', value: 10, color: '#8b5cf6' },
  { name: 'Other Components', value: 5, color: '#64748b' },
];

const COLORS = data.map(item => item.color);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ 
        background: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <p style={{ 
          margin: 0, 
          fontWeight: 'bold',
          color: data.color
        }}>{`${data.name}`}</p>
        <p style={{ margin: '5px 0' }}>
          {`Value: ${data.value}%`}
        </p>
      </div>
    );
  }

  return null;
};

export default function InventoryChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={40}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{
            paddingLeft: '20px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
} 
