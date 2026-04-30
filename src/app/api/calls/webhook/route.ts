import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      call_id,
      status,
      duration,
      transcript,
      data: callData,
    } = body;

    // Find the call
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*, candidates(*)')
      .eq('bolna_call_id', call_id)
      .single();

    if (callError || !call) {
      console.error('Call not found:', callError);
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Parse transcript and extract data
    const extractedData = parseTranscript(transcript, callData);

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

    if (updateError) throw updateError;

    // Fetch updated candidate
    const { data: updatedCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', call.candidate_id)
      .single();

    // Calculate score
    const { score, status: qualStatus } = calculateScore(updatedCandidate);

    // Update candidate with score
    await supabase
      .from('candidates')
      .update({
        qualification_score: score,
        status: qualStatus,
      })
      .eq('id', call.candidate_id);

    // Update call record
    const { error: callUpdateError } = await supabase
      .from('calls')
      .update({
        call_status: status === 'completed' ? 'completed' : 'failed',
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        transcript,
      })
      .eq('id', call.id);

    if (callUpdateError) throw callUpdateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

function parseTranscript(transcript: string, data?: any): {
  experience_years: number;
  tech_stack: string[];
  notice_period_days: number;
  expected_salary_lpa: number;
  relocation_willing: boolean;
  communication_score: number;
} {
  // Parse JSON if Bolna sends structured data
  if (data && typeof data === 'object') {
    return {
      experience_years: parseFloat(data.experience_years) || 0,
      tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : [],
      notice_period_days: parseInt(data.notice_period_days) || 0,
      expected_salary_lpa: parseFloat(data.expected_salary_lpa) || 0,
      relocation_willing: data.relocation_willing === 'yes' || data.relocation_willing === true,
      communication_score: parseInt(data.communication_score) || 5,
    };
  }

  // Fallback: Extract from transcript text
  return {
    experience_years: 0,
    tech_stack: [],
    notice_period_days: 0,
    expected_salary_lpa: 0,
    relocation_willing: false,
    communication_score: 5,
  };
}