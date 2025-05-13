'use client';

import React from 'react';
import {  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Sample data for the chart
const data = [
  { month: 'Jan', revenue: 25000, profit: 10000 },
  { month: 'Feb', revenue: 30000, profit: 12000 },
  { month: 'Mar', revenue: 28000, profit: 11000 },
  { month: 'Apr', revenue: 32000, profit: 13000 },
  { month: 'May', revenue: 40000, profit: 16000 },
  { month: 'Jun', revenue: 35000, profit: 14000 },
  { month: 'Jul', revenue: 45000, profit: 18000 },
  { month: 'Aug', revenue: 50000, profit: 21000 },
  { month: 'Sep', revenue: 42000, profit: 17000 },
  { month: 'Oct', revenue: 48000, profit: 20000 },
  { month: 'Nov', revenue: 52000, profit: 22000 },
  { month: 'Dec', revenue: 60000, profit: 24000 },
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
          {`Revenue: ₹${payload[0].value.toLocaleString()}`}
        </p>
        <p style={{ margin: 0, color: '#8b5cf6' }}>
          {`Profit: ₹${payload[1].value.toLocaleString()}`}
        </p>
      </div>
    );
  }

  return null;
};

export default function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
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
          dataKey="month" 
          tick={{ fill: '#64748b' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tickFormatter={(value) => `₹${value/1000}k`}
          tick={{ fill: '#64748b' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          activeDot={{ r: 8 }}
          strokeWidth={2}
          name="Revenue"
        />
        <Line 
          type="monotone" 
          dataKey="profit" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          name="Profit"
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 
