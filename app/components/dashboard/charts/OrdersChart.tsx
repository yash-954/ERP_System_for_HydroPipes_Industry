'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
// Sample data for the chart
const data = [
  { month: 'Jan', orders: 42, shipped: 38 },
  { month: 'Feb', orders: 55, shipped: 51 },
  { month: 'Mar', orders: 48, shipped: 45 },
  { month: 'Apr', orders: 62, shipped: 58 },
  { month: 'May', orders: 78, shipped: 72 },
  { month: 'Jun', orders: 68, shipped: 65 },
  { month: 'Jul', orders: 82, shipped: 76 },
  { month: 'Aug', orders: 95, shipped: 90 },
  { month: 'Sep', orders: 85, shipped: 80 },
  { month: 'Oct', orders: 92, shipped: 85 },
  { month: 'Nov', orders: 105, shipped: 98 },
  { month: 'Dec', orders: 120, shipped: 112 },
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
        <p style={{ margin: '5px 0', color: '#f59e0b' }}>
          {`Orders: ${payload[0].value}`}
        </p>
        <p style={{ margin: 0, color: '#10b981' }}>
          {`Shipped: ${payload[1].value}`}
        </p>
      </div>
    );
  }

  return null;
};

export default function OrdersChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
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
          tick={{ fill: '#64748b' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="orders" 
          fill="#f59e0b" 
          radius={[4, 4, 0, 0]} 
          name="Orders Received"
        />
        <Bar 
          dataKey="shipped" 
          fill="#10b981" 
          radius={[4, 4, 0, 0]} 
          name="Orders Shipped"
        />
      </BarChart>
    </ResponsiveContainer>
  );
} 
