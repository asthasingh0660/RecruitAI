'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Candidate, Call } from '@/types';
import axios from 'axios';

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingInProgress, setCallingInProgress] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [params.id]);

  const fetchCandidate = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setCandidate(data);

      // Fetch calls for this candidate
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .eq('candidate_id', params.id)
        .order('created_at', { ascending: false });

      if (!callsError) {
        setCalls(callsData || []);
      }
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCall = async () => {
  if (!candidate) return;
  setCallingInProgress(true);

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Not authenticated');
      return;
    }

    const response = await axios.post('/api/calls/trigger', {
      candidate_id: candidate.id,
      candidate_name: candidate.name,
      candidate_phone: candidate.phone,
      user_id: user.id,  // ADD THIS LINE
    });

    alert('Call triggered! AI will call the candidate shortly.');
    fetchCandidate();
  } catch (err: any) {
    alert('Error triggering call: ' + err.response?.data?.error || err.message);
  } finally {
    setCallingInProgress(false);
  }
};

  if (loading) return <div>Loading...</div>;
  if (!candidate) return <div>Candidate not found</div>;

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4">
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{candidate.name}</h1>
            <p className="text-gray-600">{candidate.phone} | {candidate.location}</p>
          </div>
          <button
            onClick={handleTriggerCall}
            disabled={callingInProgress}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {callingInProgress ? 'Calling...' : '📞 Trigger AI Call'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Experience</label>
            <p className="text-lg text-gray-900">{candidate.experience_years} years</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tech Stack</label>
            <div className="flex flex-wrap gap-2">
              {candidate.tech_stack.map((tech) => (
                <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notice Period</label>
            <p className="text-lg text-gray-900">{candidate.notice_period_days} days</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expected Salary</label>
            <p className="text-lg text-gray-900">₹{candidate.expected_salary_lpa} LPA</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">Qualification Score</label>
              <p className="text-3xl font-bold text-blue-600">{candidate.qualification_score.toFixed(1)}/100</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className={`text-lg font-semibold ${
                candidate.status === 'qualified' ? 'text-green-600' :
                candidate.status === 'maybe' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {candidate.status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {calls.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Call History</h2>
          <div className="space-y-4">
            {calls.map((call) => (
              <div key={call.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">
                      {new Date(call.created_at).toLocaleDateString()} at {new Date(call.created_at).toLocaleTimeString()}
                    </p>
                    <p className="text-sm font-medium text-gray-700">Status: {call.call_status}</p>
                  </div>
                  {call.duration_seconds && (
                    <p className="text-sm text-gray-600">{Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s</p>
                  )}
                </div>
                {call.transcript && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.transcript}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}