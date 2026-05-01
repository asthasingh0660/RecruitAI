import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate_id, candidate_name, candidate_phone, user_id } = body;

    // Validate required fields
    if (!user_id || !candidate_id || !candidate_name || !candidate_phone) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, candidate_id, candidate_name, candidate_phone' 
      }, { status: 400 });
    }

    // Create call record in DB
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

    // Trigger Bolna API call
    try {
      const bolnaPayload = {
        agent_id: process.env.BOLNA_AGENT_ID,
        phone_number: candidate_phone,
        // Optional but recommended
        campaign_name: 'RecruitAI Screening',
        language: 'en',
      };

      console.log('Sending to Bolna:', {
        url: 'https://api.bolna.ai/call',
        payload: bolnaPayload,
        auth: `Bearer ${process.env.BOLNA_API_KEY?.substring(0, 10)}...`,
      });

      const bolnaResponse = await axios.post(
        'https://api.bolna.ai/call',
        bolnaPayload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.BOLNA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('Bolna success response:', bolnaResponse.data);

      // Extract execution_id from response
      const executionId = bolnaResponse.data.execution_id;
      
      if (!executionId) {
        throw new Error('No execution_id returned from Bolna');
      }

      // Update call with bolna execution_id
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
      console.error('Bolna API Error:', {
        status: bolnaErr.response?.status,
        statusText: bolnaErr.response?.statusText,
        data: bolnaErr.response?.data,
        message: bolnaErr.message,
      });
      
      // Mark call as failed in DB
      await supabase
        .from('calls')
        .update({ call_status: 'failed' })
        .eq('id', callData.id);
      
      const errorMsg = bolnaErr.response?.data?.message || 
                       bolnaErr.response?.data?.error ||
                       bolnaErr.response?.statusText ||
                       bolnaErr.message;
      
      throw new Error(`Bolna API (${bolnaErr.response?.status}): ${errorMsg}`);
    }

  } catch (err: any) {
    console.error('Error triggering call:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}