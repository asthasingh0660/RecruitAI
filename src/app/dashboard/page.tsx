'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Candidate, Call } from '@/types';
import CandidatesTable from '@/components/CandidatesTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch candidates
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id);

      setCandidates(candidatesData || []);

      // Fetch calls
      const { data: callsData } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', user.id);

      setCalls(callsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCandidates = candidates.length;
  const qualifiedCount = candidates.filter((c) => c.status === 'qualified').length;
  const callsCompleted = calls.filter((c) => c.call_status === 'completed').length;
  const avgScore =
    totalCandidates > 0
      ? (candidates.reduce((sum, c) => sum + c.qualification_score, 0) / totalCandidates).toFixed(1)
      : 0;

  const statusDistribution = [
    {
      name: 'Qualified',
      value: candidates.filter((c) => c.status === 'qualified').length,
      fill: '#10b981',
    },
    {
      name: 'Maybe',
      value: candidates.filter((c) => c.status === 'maybe').length,
      fill: '#f59e0b',
    },
    {
      name: 'Rejected',
      value: candidates.filter((c) => c.status === 'rejected').length,
      fill: '#ef4444',
    },
  ];

  const scoreDistribution = [
    { range: '0-30', count: candidates.filter((c) => c.qualification_score < 30).length },
    { range: '30-50', count: candidates.filter((c) => c.qualification_score >= 30 && c.qualification_score < 50).length },
    { range: '50-70', count: candidates.filter((c) => c.qualification_score >= 50 && c.qualification_score < 70).length },
    { range: '70-100', count: candidates.filter((c) => c.qualification_score >= 70).length },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Total Candidates</p>
          <p className="text-4xl font-bold text-blue-600">{totalCandidates}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Qualified</p>
          <p className="text-4xl font-bold text-green-600">{qualifiedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Calls Completed</p>
          <p className="text-4xl font-bold text-purple-600">{callsCompleted}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Avg Score</p>
          <p className="text-4xl font-bold text-orange-600">{avgScore}/100</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Candidates</h3>
        <CandidatesTable candidates={candidates.slice(0, 5)} />
      </div>
    </div>
  );
}