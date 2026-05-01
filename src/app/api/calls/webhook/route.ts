import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Body:', JSON.stringify(body, null, 2));

    const executionId = body.execution_id;
    const status = body.status;
    const duration = body.duration_seconds || 0;
    const transcript = body.transcript || '';

    if (!executionId) {
      console.error('No execution_id');
      return NextResponse.json({ error: 'No execution_id' }, { status: 400 });
    }

    // Find the call
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('bolna_call_id', executionId)
      .single();

    if (callError || !call) {
      console.error('Call not found');
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Extract Bolna's JSON from transcript
    // Bolna sends the final JSON at the end of the transcript
    let bolnaExtractedData = null;
    
    try {
      // Look for JSON object in transcript (usually at the end)
      const jsonMatch = transcript.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        bolnaExtractedData = JSON.parse(jsonMatch[0]);
        console.log('Extracted Bolna data from transcript:', bolnaExtractedData);
      }
    } catch (e) {
      console.log('Could not parse Bolna JSON from transcript');
    }

    // Get candidate
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', call.candidate_id)
      .single();

    if (candError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // If Bolna extracted data, use it to update candidate
    if (bolnaExtractedData) {
      console.log('=== UPDATING CANDIDATE WITH BOLNA DATA ===');
      
      const updateData: any = {};

      // Map Bolna fields to candidate fields
      if (bolnaExtractedData.experience_level) {
        const years = bolnaExtractedData.experience_level === 'fresher' 
          ? 0 
          : parseInt(bolnaExtractedData.experience_level);
        updateData.experience_years = years;
      }

      if (bolnaExtractedData.tech_stack) {
        updateData.tech_stack = bolnaExtractedData.tech_stack;
      }

      if (bolnaExtractedData.notice_period_days !== undefined) {
        updateData.notice_period_days = bolnaExtractedData.notice_period_days;
      }

      if (bolnaExtractedData.expected_salary_lpa) {
        updateData.expected_salary_lpa = bolnaExtractedData.expected_salary_lpa;
      }

      if (bolnaExtractedData.relocation_willing !== undefined) {
        updateData.relocation_willing = bolnaExtractedData.relocation_willing;
      }

      if (bolnaExtractedData.communication_score) {
        updateData.communication_score = bolnaExtractedData.communication_score;
      }

      console.log('Update data:', updateData);

      const { error: updateError } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', call.candidate_id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Fetch updated candidate
      const { data: updatedCandidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', call.candidate_id)
        .single();

      if (updatedCandidate) {
        // Calculate score with updated data
        const { score, status: qualStatus } = calculateScore(updatedCandidate);

        console.log('Recalculated score:', score, 'Status:', qualStatus);

        // Update with calculated score
        await supabase
          .from('candidates')
          .update({
            qualification_score: score,
            status: qualStatus,
          })
          .eq('id', call.candidate_id);
      }
    } else {
      // Fallback: Use existing candidate data
      console.log('=== NO BOLNA DATA FOUND, USING EXISTING CANDIDATE DATA ===');
      
      const { score, status: qualStatus } = calculateScore(candidate);

      await supabase
        .from('candidates')
        .update({
          qualification_score: score,
          status: qualStatus,
        })
        .eq('id', call.candidate_id);
    }

    // Update call record
    const { error: callUpdateError } = await supabase
      .from('calls')
      .update({
        call_status: status === 'completed' ? 'completed' : 'failed',
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        transcript: transcript,
      })
      .eq('id', call.id);

    if (callUpdateError) throw callUpdateError;

    console.log('=== WEBHOOK SUCCESS ===');

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed'
    });

  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}