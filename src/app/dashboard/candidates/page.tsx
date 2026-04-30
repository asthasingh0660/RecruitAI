'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Candidate } from '@/types';
import CandidatesTable from '@/components/CandidatesTable';
import Link from 'next/link';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    experience_years: '',
    tech_stack: '',
    location: '',
    notice_period_days: '',
    expected_salary_lpa: '',
    relocation_willing: false,
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (err: any) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('candidates').insert({
        user_id: user.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        experience_years: parseFloat(formData.experience_years) || 0,
        tech_stack: formData.tech_stack.split(',').map((t) => t.trim()),
        location: formData.location,
        notice_period_days: parseInt(formData.notice_period_days) || 0,
        expected_salary_lpa: parseFloat(formData.expected_salary_lpa) || 0,
        relocation_willing: formData.relocation_willing,
      });

      if (error) throw error;

      setFormData({
        name: '',
        phone: '',
        email: '',
        experience_years: '',
        tech_stack: '',
        location: '',
        notice_period_days: '',
        expected_salary_lpa: '',
        relocation_willing: false,
      });
      setShowForm(false);
      fetchCandidates();
    } catch (err: any) {
      console.error('Error adding candidate:', err);
      alert('Error adding candidate');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Candidates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Candidate'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 text-gray-700">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <input
              type="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Experience (years)"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
                type="text"
                placeholder="React, Node.js, PostgreSQL"
                value={formData.tech_stack}
                onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Notice Period (days)"
              value={formData.notice_period_days}
              onChange={(e) => setFormData({ ...formData, notice_period_days: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Expected Salary (LPA)"
              value={formData.expected_salary_lpa}
              onChange={(e) => setFormData({ ...formData, expected_salary_lpa: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.relocation_willing}
                onChange={(e) => setFormData({ ...formData, relocation_willing: e.target.checked })}
              />
              <span>Open to Relocation</span>
            </label>
            <button
              type="submit"
              className="col-span-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Candidate
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 mb-4">No candidates yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Add First Candidate
          </button>
        </div>
      ) : (
        <CandidatesTable candidates={candidates} />
      )}
    </div>
  );
}