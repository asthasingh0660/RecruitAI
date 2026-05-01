import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate_id, candidate_name, candidate_phone, user_id } = body;

    // Validate required fields
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Create call record in DB with user_id
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert({
        user_id,
        candidate_id,
        call_status: 'pending',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (callError) throw callError;

    // Trigger Bolna API call - SIMPLIFIED PAYLOAD
    try {
      console.log('Calling Bolna with:', {
        agent_id: process.env.BOLNA_AGENT_ID,
        phone_number: candidate_phone,
        name: candidate_name,
      });

      const bolnaResponse = await axios.post(
        'https://api.bolna.ai/call',
        {
          agent_id: process.env.BOLNA_AGENT_ID,
          phone_number: candidate_phone,  // Direct field, not in recipient object
          name: candidate_name,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Bolna response:', bolnaResponse.data);

      // Update call with bolna execution_id
      const executionId = bolnaResponse.data.execution_id || bolnaResponse.data.call_id;
      await supabase
        .from('calls')
        .update({ 
          bolna_call_id: executionId,
          call_status: 'initiated'
        })
        .eq('id', callData.id);

      return NextResponse.json({ 
        success: true, 
        call_id: callData.id,
        execution_id: executionId 
      });
    } catch (bolnaErr: any) {
      console.error('Bolna API Error Details:', {
        status: bolnaErr.response?.status,
        data: bolnaErr.response?.data,
        message: bolnaErr.message,
      });
      
      // Mark call as failed
      await supabase
        .from('calls')
        .update({ call_status: 'failed' })
        .eq('id', callData.id);
      
      const errorMsg = bolnaErr.response?.data?.message || bolnaErr.response?.data?.error || bolnaErr.message;
      throw new Error(`Bolna API error: ${errorMsg}`);
    }
  } catch (err: any) {
    console.error('Error triggering call:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}