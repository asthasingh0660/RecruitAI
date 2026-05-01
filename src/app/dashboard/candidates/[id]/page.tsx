'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import Link from 'next/link';

interface Candidate {
  id: string;
  name: string;
  phone: string;
  email?: string;
  experience_years: number;
  tech_stack: string[];
  location?: string;
  notice_period_days: number;
  expected_salary_lpa: number;
  relocation_willing: boolean;
  communication_score: number;
  qualification_score: number;
  status: string;
  created_at: string;
}

interface Call {
  id: string;
  bolna_call_id: string;
  call_status: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  transcript?: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingInProgress, setCallingInProgress] = useState(false);
  const [calculatingScore, setCalculatingScore] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [candidateId]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const { data: candidateData, error: candError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candError) throw candError;
      setCandidate(candidateData);

      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (callsError) throw callsError;
      setCalls(callsData || []);
    } catch (err) {
      console.error('Error fetching candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCall = async () => {
    if (!candidate) return;
    setCallingInProgress(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Not authenticated');
        return;
      }
      const response = await axios.post('/api/calls/trigger', {
        candidate_id: candidate.id,
        candidate_name: candidate.name,
        candidate_phone: candidate.phone,
        user_id: user.id,
      });
      alert('Call triggered! AI will call the candidate shortly.');
      fetchCandidate();
    } catch (err: any) {
      alert('Error triggering call: ' + (err.response?.data?.error || err.message));
    } finally {
      setCallingInProgress(false);
    }
  };

  const handleCalculateScore = async () => {
    if (!candidate) return;
    setCalculatingScore(true);
    try {
      const response = await axios.post('/api/candidates/calculate-score', {
        candidate_id: candidate.id,
      });
      
      alert(`Score calculated! Score: ${response.data.score.toFixed(1)}/100, Status: ${response.data.status}`);
      fetchCandidate();
    } catch (err: any) {
      alert('Error calculating score: ' + (err.response?.data?.error || err.message));
    } finally {
      setCalculatingScore(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-900">Loading...</div>;
  if (!candidate) return <div className="p-8 text-gray-900">Candidate not found</div>;

  return (
    <div className="p-8 max-w-4xl bg-white">
      <Link href="/dashboard/candidates" className="text-blue-600 hover:text-blue-700 hover:underline mb-6 inline-block font-semibold">
        ← Back
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{candidate.name}</h1>
            <p className="text-gray-700 text-lg">
              {candidate.phone} | {candidate.location || 'N/A'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleTriggerCall}
              disabled={callingInProgress}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              {callingInProgress ? '📞 Calling...' : '📞 Trigger AI Call'}
            </button>
            <button
              onClick={handleCalculateScore}
              disabled={calculatingScore}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              {calculatingScore ? '🧮 Calculating...' : '🧮 Calculate Score'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border-b pb-4">
            <h3 className="text-gray-600 text-sm uppercase font-semibold mb-2">Experience</h3>
            <p className="text-2xl font-bold text-gray-900">{candidate.experience_years} years</p>
          </div>
          <div className="border-b pb-4">
            <h3 className="text-gray-600 text-sm uppercase font-semibold mb-2">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.tech_stack?.map((tech) => (
                <span key={tech} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="border-b pb-4">
            <h3 className="text-gray-600 text-sm uppercase font-semibold mb-2">Notice Period</h3>
            <p className="text-2xl font-bold text-gray-900">{candidate.notice_period_days} days</p>
          </div>
          <div className="border-b pb-4">
            <h3 className="text-gray-600 text-sm uppercase font-semibold mb-2">Expected Salary</h3>
            <p className="text-2xl font-bold text-gray-900">₹{candidate.expected_salary_lpa} LPA</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-8 border border-blue-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-gray-700 text-sm uppercase font-semibold mb-2">Qualification Score</h3>
              <p className="text-5xl font-bold text-blue-700">{candidate.qualification_score.toFixed(1)}/100</p>
            </div>
            <div>
              <h3 className="text-gray-700 text-sm uppercase font-semibold mb-2">Status</h3>
              <p className={`text-3xl font-bold ${
                candidate.status === 'Qualified' ? 'text-green-600' :
                candidate.status === 'Maybe' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {candidate.status?.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-300">
            <p className="text-sm text-gray-800 font-medium">
              <strong className="text-gray-900">Relocation Willing:</strong> <span className="text-gray-800">{candidate.relocation_willing ? 'Yes' : 'No'}</span> | 
              <strong className="text-gray-900 ml-4">Communication Score:</strong> <span className="text-gray-800">{candidate.communication_score}/10</span>
            </p>
          </div>
        </div>

        {calls.length > 0 && (
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Call History</h2>
            {calls.map((call) => (
              <div key={call.id} className="border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      {new Date(call.started_at).toLocaleString()}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      Status: <span className={`${
                        call.call_status === 'completed' ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'
                      }`}>
                        {call.call_status}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-medium">Duration: {call.duration_seconds}s</p>
                  </div>
                </div>
                {call.transcript && (
                  <details className="text-sm text-gray-800 mt-3">
                    <summary className="cursor-pointer font-semibold text-gray-900 hover:text-gray-700 transition">
                      📄 View Transcript
                    </summary>
                    <div className="mt-3 p-4 bg-gray-50 rounded border border-gray-300 max-h-96 overflow-y-auto whitespace-pre-wrap text-xs text-gray-800 font-mono">
                      {call.transcript}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}