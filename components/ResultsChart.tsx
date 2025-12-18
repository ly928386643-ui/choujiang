import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Program, VoteRecord } from '../types';

interface ResultsChartProps {
  programs: Program[];
  votes: VoteRecord[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6', '#64748b'];

const ResultsChart: React.FC<ResultsChartProps> = ({ programs, votes }) => {
  const data = useMemo(() => {
    // Calculate vote counts
    const counts: Record<string, number> = {};
    programs.forEach(p => counts[p.id] = 0);
    votes.forEach(v => {
      if (counts[v.programId] !== undefined) {
        counts[v.programId]++;
      }
    });

    // Transform to array and sort by votes descending
    return programs
      .map(p => ({
        name: p.name,
        shortName: p.name.length > 6 ? p.name.substring(0, 6) + '...' : p.name,
        votes: counts[p.id] || 0,
        performer: p.performer
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [programs, votes]);

  return (
    <div className="w-full h-[400px] bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-lg font-bold text-slate-800 mb-4">实时排名数据</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="shortName" 
            width={100} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            interval={0}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ fill: '#f1f5f9' }}
          />
          <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={20} animationDuration={500}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;