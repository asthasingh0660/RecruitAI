export type Candidate = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  experience_years: number;
  tech_stack: string[];
  location: string;
  notice_period_days: number;
  expected_salary_lpa: number;
  relocation_willing: boolean;
  communication_score: number;
  qualification_score: number;
  status: 'pending' | 'qualified' | 'maybe' | 'rejected';
  created_at: string;
  updated_at: string;
};

export type Call = {
  id: string;
  user_id: string;
  candidate_id: string;
  bolna_call_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  call_status: 'pending' | 'completed' | 'failed' | 'missed';
  created_at: string;
};