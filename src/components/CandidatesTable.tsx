'use client';
import { Candidate } from '@/types';
import Link from 'next/link';

interface CandidatesTableProps {
  candidates: Candidate[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function CandidatesTable({
  candidates,
  onEdit,
  onDelete,
}: CandidatesTableProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      qualified: 'bg-green-100 text-green-800',
      maybe: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.pending;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Experience</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tech Stack</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{candidate.name}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{candidate.phone}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{candidate.experience_years} yrs</td>
              <td className="px-6 py-4 text-sm text-gray-700">{candidate.tech_stack.join(', ')}</td>
              <td className={`px-6 py-4 text-sm font-semibold ${getScoreColor(candidate.qualification_score)}`}>
                {candidate.qualification_score.toFixed(1)}/100
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                  {candidate.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                <Link href={`/dashboard/candidates/${candidate.id}`} className="text-blue-600 hover:underline">
                  View
                </Link>
                {onEdit && (
                  <button onClick={() => onEdit(candidate.id)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(candidate.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}