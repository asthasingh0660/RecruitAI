import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate_id } = body;

    if (!candidate_id) {
      return NextResponse.json({ error: 'candidate_id required' }, { status: 400 });
    }

    // Get candidate data
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidate_id)
      .single();

    if (candError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Get the latest call with transcript
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('candidate_id', candidate_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!callsError && calls && calls.length > 0) {
      const transcript = calls[0].transcript || '';
      
      // Extract data from transcript
      const extractedData = extractFromTranscript(transcript);
      
      console.log('Extracted from transcript:', extractedData);

      // Update candidate with extracted data
      const updateData: any = {};
      
      if (extractedData.experience_years !== null) {
        updateData.experience_years = extractedData.experience_years;
      }
      
      if (extractedData.tech_stack && extractedData.tech_stack.length > 0) {
        updateData.tech_stack = extractedData.tech_stack;
      }
      
      if (extractedData.notice_period_days !== null) {
        updateData.notice_period_days = extractedData.notice_period_days;
      }
      
      if (extractedData.expected_salary_lpa !== null) {
        updateData.expected_salary_lpa = extractedData.expected_salary_lpa;
      }
      
      if (extractedData.relocation_willing !== null) {
        updateData.relocation_willing = extractedData.relocation_willing;
      }
      
      if (extractedData.communication_score !== null) {
        updateData.communication_score = extractedData.communication_score;
      }

      console.log('Update data:', updateData);

      // Only update if we have extracted data
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('candidates')
          .update(updateData)
          .eq('id', candidate_id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      }

      // Fetch updated candidate
      const { data: updatedCandidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidate_id)
        .single();

      if (updatedCandidate) {
        // Calculate score with updated data
        const { score, status: qualStatus } = calculateScore(updatedCandidate);

        console.log('Calculated score:', score, 'Status:', qualStatus);

        // Update with calculated score
        const { error: scoreError } = await supabase
          .from('candidates')
          .update({
            qualification_score: score,
            status: qualStatus,
          })
          .eq('id', candidate_id);

        if (scoreError) throw scoreError;

        return NextResponse.json({ 
          success: true,
          score,
          status: qualStatus,
          message: 'Score calculated and updated successfully',
          extractedData,
        });
      }
    }

    // Fallback: just calculate from existing data
    const { score, status: qualStatus } = calculateScore(candidate);

    await supabase
      .from('candidates')
      .update({
        qualification_score: score,
        status: qualStatus,
      })
      .eq('id', candidate_id);

    return NextResponse.json({ 
      success: true,
      score,
      status: qualStatus,
      message: 'Score calculated from existing data'
    });

  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

function extractFromTranscript(transcript: string): {
  experience_years: number | null;
  tech_stack: string[];
  notice_period_days: number | null;
  expected_salary_lpa: number | null;
  relocation_willing: boolean | null;
  communication_score: number | null;
} {
  // First try to find JSON in transcript (Bolna sends it at end)
  try {
    const jsonMatch = transcript.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log('Found Bolna JSON data:', data);
      
      return {
        experience_years: data.experience_level === 'fresher' ? 0 : (parseInt(data.experience_level) || null),
        tech_stack: data.tech_stack || [],
        notice_period_days: data.notice_period_days || null,
        expected_salary_lpa: data.expected_salary_lpa || null,
        relocation_willing: data.relocation_willing,
        communication_score: data.communication_score || null,
      };
    }
  } catch (e) {
    console.log('Could not parse JSON from transcript, extracting manually');
  }

  // Manual extraction from text
  const result = {
    experience_years: null as number | null,
    tech_stack: [] as string[],
    notice_period_days: null as number | null,
    expected_salary_lpa: null as number | null,
    relocation_willing: null as boolean | null,
    communication_score: null as number | null,
  };

  // Extract tech stack (comprehensive list)
  const allTechs = [
    'React', 'Vue', 'Angular', 'Next.js', 'Svelte',
    'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Oracle',
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'HTML', 'CSS', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'Prompt Engineering', 'AI Integration', 'LLM', 'RAG', 'Vector Database'
  ];

  for (const tech of allTechs) {
    if (new RegExp(`\\b${tech}\\b`, 'i').test(transcript)) {
      result.tech_stack.push(tech);
    }
  }

  // Extract experience years
  const expMatch = transcript.match(/(\d+)\s*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp)/i);
  if (expMatch) {
    result.experience_years = parseInt(expMatch[1]);
  } else if (/fresher|no\s*experience|0\s*years/i.test(transcript)) {
    result.experience_years = 0;
  }

  // Extract notice period
  const noticeMatch = transcript.match(/notice\s*period\s*(?:is\s*)?(?:zero|0|(\d+))\s*(?:day)?/i);
  if (noticeMatch) {
    result.notice_period_days = noticeMatch[1] ? parseInt(noticeMatch[1]) : 0;
  }

  // Extract salary
  const salaryMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lakh)/i);
  if (salaryMatch) {
    result.expected_salary_lpa = parseFloat(salaryMatch[1]);
  }

  // Extract relocation
  if (/open\s*to|willing|yes|relocate|relocation/i.test(transcript)) {
    result.relocation_willing = true;
  } else if (/no|not\s*willing|can't\s*relocate/i.test(transcript)) {
    result.relocation_willing = false;
  }

  // Communication score (1-10 scale or extract from confidence)
  const commMatch = transcript.match(/(?:confidence|rate.*skill|coding\s*skills?)[:\s]*(\d+)/i);
  if (commMatch) {
    result.communication_score = parseInt(commMatch[1]);
  } else {
    // Default: count number of complete sentences, max 10
    const sentences = transcript.match(/[.!?]+/g);
    result.communication_score = Math.min(10, Math.max(5, (sentences?.length || 0) / 20));
  }

  console.log('Manually extracted data:', result);
  return result;
}