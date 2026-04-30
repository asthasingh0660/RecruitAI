import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate_id, candidate_name, candidate_phone } = body;

    // Create call record in DB
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert({
        candidate_id,
        call_status: 'pending',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (callError) throw callError;

    // Trigger Bolna API call
    try {
      const bolnaResponse = await axios.post(
        'https://api.bolna.ai/v1/call',
        {
          agent_id: process.env.BOLNA_AGENT_ID,
          phone_number: candidate_phone,
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook`,
          variables: {
            candidate_name,
            call_id: callData.id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update call with bolna_call_id
      await supabase
        .from('calls')
        .update({ bolna_call_id: bolnaResponse.data.call_id })
        .eq('id', callData.id);

      return NextResponse.json({ success: true, call_id: callData.id });
    } catch (bolnaErr: any) {
      // Mark call as failed
      await supabase
        .from('calls')
        .update({ call_status: 'failed' })
        .eq('id', callData.id);

      throw new Error(`Bolna API error: ${bolnaErr.response?.data?.message || bolnaErr.message}`);
    }
  } catch (err: any) {
    console.error('Error triggering call:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}