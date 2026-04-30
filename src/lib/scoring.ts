import { Candidate } from '@/types';

export function calculateScore(candidate: Candidate): {
  score: number;
  status: 'qualified' | 'maybe' | 'rejected';
} {
  let score = 0;

  // Experience scoring (0-40 points for experienced, fresher gets 0)
  if (candidate.experience_years >= 3) {
    score += 40;
  } else if (candidate.experience_years >= 1) {
    score += 25;
  } else if (candidate.experience_years > 0) {
    score += 15;
  }
  // Freshers get different evaluation, so skip experience points

  // Tech stack match (0-35 points)
  const preferredTechs = ['React', 'Next.js', 'Node.js', 'PostgreSQL'];
  const matchCount = candidate.tech_stack.filter((tech) =>
    preferredTechs.some((p) => tech.toLowerCase().includes(p.toLowerCase()))
  ).length;

  score += (matchCount / preferredTechs.length) * 35;

  // Notice period (0-15 points)
  if (candidate.notice_period_days <= 7) {
    score += 15;
  } else if (candidate.notice_period_days <= 15) {
    score += 12;
  } else if (candidate.notice_period_days <= 30) {
    score += 8;
  } else {
    score += 2;
  }

  // Salary fit (0-10 points) - assume budget is 6-15 LPA
  if (candidate.expected_salary_lpa >= 6 && candidate.expected_salary_lpa <= 15) {
    score += 10;
  } else if (candidate.expected_salary_lpa > 0) {
    score += 5;
  }

  // Communication (0-10 points)
  if (candidate.communication_score) {
    score += Math.min(candidate.communication_score, 10);
  }

  // Cap at 100
  score = Math.min(score, 100);

  let status: 'qualified' | 'maybe' | 'rejected';
  if (score >= 70) {
    status = 'qualified';
  } else if (score >= 50) {
    status = 'maybe';
  } else {
    status = 'rejected';
  }

  return { score, status };
}