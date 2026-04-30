'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Candidate } from '@/types';

export default function AnalyticsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id);

      setCandidates(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const conversionRate = candidates.length > 0
    ? ((candidates.filter((c) => c.status === 'qualified').length / candidates.length) * 100).toFixed(1)
    : 0;

  const topTechs = candidates.reduce((acc: Record<string, number>, candidate) => {
    candidate.tech_stack.forEach((tech) => {
      acc[tech] = (acc[tech] || 0) + 1;
    });
    return acc;
  }, {});

  const topTechsArray = Object.entries(topTechs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tech, count]) => ({ tech, count }));

  const salaryStats = candidates
    .filter((c) => c.expected_salary_lpa > 0)
    .map((c) => c.expected_salary_lpa)
    .sort((a, b) => a - b);

  const avgSalary = salaryStats.length > 0
    ? (salaryStats.reduce((a, b) => a + b, 0) / salaryStats.length).toFixed(1)
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Conversion Rate</p>
          <p className="text-4xl font-bold text-blue-600">{conversionRate}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Avg Expected Salary</p>
          <p className="text-4xl font-bold text-green-600">₹{avgSalary} LPA</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Total Candidates</p>
          <p className="text-4xl font-bold text-purple-600">{candidates.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Tech Stacks</h3>
        <div className="space-y-3">
          {topTechsArray.map(({ tech, count }) => (
            <div key={tech} className="flex items-center justify-between">
              <span className="text-gray-700">{tech}</span>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-200 rounded-full h-8 w-8 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Experience Distribution</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Freshers</p>
            <p className="text-2xl font-bold">{candidates.filter((c) => c.experience_years === 0).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">1-3 Years</p>
            <p className="text-2xl font-bold">{candidates.filter((c) => c.experience_years > 0 && c.experience_years <= 3).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">3+ Years</p>
            <p className="text-2xl font-bold">{candidates.filter((c) => c.experience_years > 3).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}