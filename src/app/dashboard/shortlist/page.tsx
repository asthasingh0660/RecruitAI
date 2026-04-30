'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Candidate } from '@/types';
import Link from 'next/link';

const columns = ['qualified', 'maybe', 'rejected'] as const;
const columnLabels: Record<typeof columns[number], string> = {
  qualified: '✅ Qualified',
  maybe: '🟡 Maybe',
  rejected: '❌ Rejected',
};

export default function ShortlistPage() {
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
        .eq('user_id', user.id)
        .neq('status', 'pending');

      setCandidates(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Shortlist</h1>

      <div className="grid grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column} className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{columnLabels[column]}</h3>
            <div className="space-y-3">
              {candidates
                .filter((c) => c.status === column)
                .map((candidate) => (
                  <Link key={candidate.id} href={`/dashboard/candidates/${candidate.id}`}>
                    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer">
                      <p className="font-semibold text-gray-900">{candidate.name}</p>
                      <p className="text-sm text-gray-600">{candidate.phone}</p>
                      <p className="text-sm text-gray-600">{candidate.experience_years} yrs</p>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {candidate.qualification_score.toFixed(0)}/100
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}