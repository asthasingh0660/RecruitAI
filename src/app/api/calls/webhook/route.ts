import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // LOG 1: Raw webhook body
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Raw body:', JSON.stringify(body, null, 2));
    console.log('Body keys:', Object.keys(body));
    console.log('Body type:', typeof body);
    
    // LOG 2: Check all possible ID fields
    console.log('=== CHECKING FOR CALL ID ===');
    console.log('execution_id:', body.execution_id);
    console.log('call_id:', body.call_id);
    console.log('id:', body.id);
    console.log('request_id:', body.request_id);
    
    // LOG 3: Check status and data fields
    console.log('=== STATUS AND DATA ===');
    console.log('status:', body.status);
    console.log('duration:', body.duration);
    console.log('duration_seconds:', body.duration_seconds);
    console.log('transcript:', body.transcript?.substring(0, 100) || 'NO TRANSCRIPT');
    console.log('data field:', body.data ? JSON.stringify(body.data, null, 2) : 'NO DATA FIELD');
    
    // Determine which ID field Bolna actually sent
    const executionId = body.execution_id || body.call_id || body.id;
    const status = body.status || 'unknown';
    const duration = body.duration_seconds || body.duration || 0;
    const transcript = body.transcript || '';

    console.log('=== EXTRACTED VALUES ===');
    console.log('Using ID:', executionId);
    console.log('Status:', status);
    console.log('Duration:', duration);
    console.log('Has transcript:', !!transcript);

    if (!executionId) {
      console.error('ERROR: No execution_id found in webhook body!');
      console.error('Full body was:', JSON.stringify(body));
      return NextResponse.json({ 
        error: 'No execution_id/call_id found',
        receivedKeys: Object.keys(body)
      }, { status: 400 });
    }

    // LOG 4: Search for call
    console.log('=== SEARCHING FOR CALL ===');
    console.log('Looking for call with bolna_call_id:', executionId);

    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('bolna_call_id', executionId)
      .single();

    if (callError) {
      console.error('Error querying calls:', callError);
      // Try alternative search
      console.log('Trying to find any recent pending call...');
      const { data: recentCalls } = await supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      console.log('Recent calls:', recentCalls);
    }

    if (!call) {
      console.error('Call not found for execution_id:', executionId);
      return NextResponse.json({ 
        error: 'Call not found',
        searched_for: executionId
      }, { status: 404 });
    }

    console.log('Found call:', call.id);
    console.log('Call candidate_id:', call.candidate_id);

    // LOG 5: Get candidate
    console.log('=== FETCHING CANDIDATE ===');
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', call.candidate_id)
      .single();

    if (candError || !candidate) {
      console.error('Candidate error:', candError);
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    console.log('Found candidate:', candidate.name);
    console.log('Current candidate data:', {
      experience_years: candidate.experience_years,
      tech_stack: candidate.tech_stack,
      notice_period_days: candidate.notice_period_days,
      expected_salary_lpa: candidate.expected_salary_lpa,
      relocation_willing: candidate.relocation_willing,
      communication_score: candidate.communication_score,
    });

    // LOG 6: Calculate score
    console.log('=== CALCULATING SCORE ===');
    const { score, status: qualStatus } = calculateScore(candidate);
    console.log('Calculated score:', score);
    console.log('Qualification status:', qualStatus);

    // LOG 7: Update candidate
    console.log('=== UPDATING CANDIDATE ===');
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        qualification_score: score,
        status: qualStatus,
      })
      .eq('id', call.candidate_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }
    console.log('Candidate updated successfully');

    // LOG 8: Update call
    console.log('=== UPDATING CALL ===');
    const { error: callUpdateError } = await supabase
      .from('calls')
      .update({
        call_status: status === 'completed' ? 'completed' : 'failed',
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        transcript: transcript,
      })
      .eq('id', call.id);

    if (callUpdateError) {
      console.error('Call update error:', callUpdateError);
      throw callUpdateError;
    }
    console.log('Call updated successfully');

    const processingTime = Date.now() - startTime;
    console.log('=== WEBHOOK PROCESSED ===');
    console.log('Processing time:', processingTime, 'ms');
    console.log('Success: true');

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      processingTime: processingTime,
      score: score,
      status: qualStatus,
    });

  } catch (err: any) {
    const processingTime = Date.now() - startTime;
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Processing time:', processingTime, 'ms');
    
    return NextResponse.json({ 
      error: err.message,
      timestamp: new Date().toISOString(),
      processingTime: processingTime,
    }, { status: 400 });
  }
}