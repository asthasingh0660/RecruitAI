import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Bolna sends execution_id, not call_id
    const executionId = body.execution_id;
    const status = body.status;
    const duration = body.duration || 0;
    const transcript = body.transcript || '';

    if (!executionId) {
      console.error('No execution_id in webhook body');
      return NextResponse.json({ error: 'No execution_id provided' }, { status: 400 });
    }

    // Find the call by bolna_call_id (which we stored as execution_id)
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*, candidates(*)')
      .eq('bolna_call_id', executionId)
      .single();

    if (callError || !call) {
      console.error('Call not found with execution_id:', executionId, callError);
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    console.log('Found call:', call.id);

    // Parse transcript to extract candidate data
    const extractedData = parseTranscript(transcript, body);

    console.log('Extracted data:', extractedData);

    // Update candidate with extracted data
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        experience_years: extractedData.experience_years,
        tech_stack: extractedData.tech_stack,
        notice_period_days: extractedData.notice_period_days,
        expected_salary_lpa: extractedData.expected_salary_lpa,
        relocation_willing: extractedData.relocation_willing,
        communication_score: extractedData.communication_score,
      })
      .eq('id', call.candidate_id);

    if (updateError) {
      console.error('Error updating candidate:', updateError);
      throw updateError;
    }

    // Fetch updated candidate
    const { data: updatedCandidate, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', call.candidate_id)
      .single();

    if (fetchError || !updatedCandidate) {
      throw new Error('Failed to fetch updated candidate');
    }

    console.log('Updated candidate:', updatedCandidate);

    // Calculate score using the scoring function
    const { score, status: qualStatus } = calculateScore(updatedCandidate);

    console.log('Calculated score:', score, 'Status:', qualStatus);

    // Update candidate with score and status
    const { error: scoreUpdateError } = await supabase
      .from('candidates')
      .update({
        qualification_score: score,
        status: qualStatus,
      })
      .eq('id', call.candidate_id);

    if (scoreUpdateError) {
      console.error('Error updating score:', scoreUpdateError);
      throw scoreUpdateError;
    }

    // Update call record
    const { error: callUpdateError } = await supabase
      .from('calls')
      .update({
        call_status: status === 'completed' ? 'completed' : status,
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        transcript: transcript,
      })
      .eq('id', call.id);

    if (callUpdateError) {
      console.error('Error updating call:', callUpdateError);
      throw callUpdateError;
    }

    console.log('Webhook processed successfully');

    return NextResponse.json({ success: true, message: 'Webhook processed' });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ 
      error: err.message,
      details: err.toString()
    }, { status: 400 });
  }
}

function parseTranscript(transcript: string, bolnaData?: any): {
  experience_years: number;
  tech_stack: string[];
  notice_period_days: number;
  expected_salary_lpa: number;
  relocation_willing: boolean;
  communication_score: number;
} {
  // If Bolna sends structured data in the webhook
  if (bolnaData && bolnaData.data) {
    const data = bolnaData.data;
    return {
      experience_years: parseFloat(data.experience_years) || 0,
      tech_stack: Array.isArray(data.tech_stack) 
        ? data.tech_stack 
        : (typeof data.tech_stack === 'string' ? data.tech_stack.split(',').map((s: string) => s.trim()) : []),
      notice_period_days: parseInt(data.notice_period_days) || 0,
      expected_salary_lpa: parseFloat(data.expected_salary_lpa) || 0,
      relocation_willing: data.relocation_willing === 'yes' || data.relocation_willing === true || data.relocation_willing === 'true',
      communication_score: parseInt(data.communication_score) || 5,
    };
  }

  // Fallback: Parse from transcript text using simple pattern matching
  if (transcript) {
    const experience = extractNumber(transcript, /(\d+)\s*(?:year|yr)/i);
    const salary = extractNumber(transcript, /(\d+)\s*(?:lpa|lakhs?)/i);
    const notice = extractNumber(transcript, /(\d+)\s*(?:day|notice)/i);
    
    const techStack = extractTechStack(transcript);
    const relocation = /yes|open|willing|relocate|relocation/i.test(transcript);
    const communication = extractNumber(transcript, /(?:rate|confidence)\s*(?:is\s*)?(\d+)/i) || 5;

    return {
      experience_years: experience,
      tech_stack: techStack,
      notice_period_days: notice,
      expected_salary_lpa: salary,
      relocation_willing: relocation,
      communication_score: communication,
    };
  }

  // Default values if nothing found
  return {
    experience_years: 0,
    tech_stack: [],
    notice_period_days: 0,
    expected_salary_lpa: 0,
    relocation_willing: false,
    communication_score: 5,
  };
}

function extractNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : 0;
}

function extractTechStack(transcript: string): string[] {
  const techs = ['React', 'Node.js', 'PostgreSQL', 'Python', 'JavaScript', 'TypeScript', 'Next.js', 'Vue', 'Angular', 'Java', 'C++', 'Go', 'Rust'];
  const found: string[] = [];
  
  for (const tech of techs) {
    if (new RegExp(`\\b${tech}\\b`, 'i').test(transcript)) {
      found.push(tech);
    }
  }
  
  return found;
}